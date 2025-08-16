import os, json, uuid
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, render_template_string, redirect
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from apscheduler.schedulers.background import BackgroundScheduler
import stripe

from config import Config, FEATURES_BY_PLAN
from db_models import db, Tenant, User, Membership, Invitation, AuditLog, NotificationSettings, Booking, ReminderLog
from onboarding import send_email_smtp, onboarding_email
from sms import send_sms

app = Flask(__name__)
app.secret_key = Config.FLASK_SECRET_KEY
app.config["SQLALCHEMY_DATABASE_URI"] = Config.SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = Config.SQLALCHEMY_TRACK_MODIFICATIONS

db.init_app(app)
with app.app_context():
    db.create_all()

stripe.api_key = Config.STRIPE_SECRET_KEY
signer = URLSafeTimedSerializer(app.secret_key)

# ---------- Helpers ----------
def require_admin(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        pwd = request.args.get("p") or request.headers.get("X-Admin-Password")
        if pwd != Config.ADMIN_PASSWORD:
            return ("Forbidden: add ?p=<password> or X-Admin-Password header", 403)
        return fn(*args, **kwargs)
    return wrapper

def get_current_user():
    # Demo seed: one user + tenant
    u = User.query.filter_by(email="demo@smartflowsystems.com").first()
    if not u:
        u = User(id="demo-user", email="demo@smartflowsystems.com", name="Demo User")
        db.session.add(u); db.session.commit()
    t = Tenant.query.filter_by(id="demo-tenant").first()
    if not t:
        t = Tenant(id="demo-tenant", name="Demo Workspace", owner_user_id=u.id)
        db.session.add(t); db.session.commit()
        m = Membership(tenant_id=t.id, user_id=u.id, role="owner",
                       invited_at=datetime.utcnow(), activated_at=datetime.utcnow())
        db.session.add(m); db.session.commit()
    return u, t

def log_action(tenant_id, actor_user_id, action, target_type, target_id, metadata=None):
    rec = AuditLog(tenant_id=tenant_id, actor_user_id=actor_user_id, action=action,
                   target_type=target_type, target_id=target_id, audit_metadata=json.dumps(metadata or {}))
    db.session.add(rec); db.session.commit()

def get_or_create_notif_settings(tenant_id: str) -> NotificationSettings:
    s = NotificationSettings.query.get(tenant_id)
    if not s:
        s = NotificationSettings(tenant_id=tenant_id)
        db.session.add(s); db.session.commit()
    return s

def notif_ok(tenant_id: str, channel: str) -> bool:
    s = get_or_create_notif_settings(tenant_id)
    if channel == "email":
        return bool(s.email_enabled)
    if channel == "sms":
        has_keys = bool(Config.VONAGE_API_KEY and Config.VONAGE_API_SECRET and Config.VONAGE_NUMBER)
        return bool(s.sms_enabled and has_keys)
    return False

def seat_limit_for_plan(plan:str) -> int:
    return {"starter":2,"flowkit":5,"launchpack":15}.get(plan, 2)

def tenant_active_seats(tenant_id:str) -> int:
    return Membership.query.filter_by(tenant_id=tenant_id).count()

def _price_for(plan, mode):
    mapping = {
        ("starter","monthly"):  Config.STRIPE_PRICE_STARTER_MONTHLY,
        ("flowkit","monthly"):  Config.STRIPE_PRICE_FLOWKIT_MONTHLY,
        ("launchpack","monthly"): Config.STRIPE_PRICE_LAUNCHPACK_MONTHLY,
        ("starter","oneoff"):   Config.STRIPE_PRICE_STARTER_ONEOFF,
        ("flowkit","oneoff"):   Config.STRIPE_PRICE_FLOWKIT_ONEOFF,
        ("launchpack","oneoff"): Config.STRIPE_PRICE_LAUNCHPACK_ONEOFF,
    }
    return mapping.get((plan,mode))

# ---------- UI: Landing & Pricing ----------
LANDING = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartFlow Systems</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
            color: #fff; min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .hero { text-align: center; padding: 100px 0; }
        .hero h1 { 
            font-size: 4rem; font-weight: 700; margin-bottom: 20px;
            background: linear-gradient(45deg, #d4af37, #ffd700);
            -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .hero p { font-size: 1.5rem; margin-bottom: 40px; color: #ccc; }
        .btn { 
            display: inline-block; padding: 15px 30px; 
            background: linear-gradient(45deg, #d4af37, #ffd700);
            color: #000; text-decoration: none; border-radius: 8px;
            font-weight: 600; font-size: 1.1rem; transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .features { padding: 80px 0; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .feature { 
            background: rgba(212, 175, 55, 0.1); padding: 30px; border-radius: 12px;
            border: 1px solid rgba(212, 175, 55, 0.2);
        }
        .feature h3 { color: #d4af37; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>SmartFlow Systems</h1>
            <p>Intelligent Booking & Workflow Automation</p>
            <a href="/pricing" class="btn">Get Started</a>
        </div>
        <div class="features">
            <div class="features-grid">
                <div class="feature">
                    <h3>🗓️ Smart Booking</h3>
                    <p>AI-powered scheduling with automated reminders</p>
                </div>
                <div class="feature">
                    <h3>📱 Multi-Channel Alerts</h3>
                    <p>Email & SMS notifications via Vonage</p>
                </div>
                <div class="feature">
                    <h3>👥 Team Management</h3>
                    <p>Multi-tenant user administration</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>"""

PRICING = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pricing - SmartFlow Systems</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
            color: #fff; min-height: 100vh; padding: 50px 0;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        h1 { 
            text-align: center; font-size: 3rem; margin-bottom: 50px;
            background: linear-gradient(45deg, #d4af37, #ffd700);
            -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; }
        .plan { 
            background: rgba(212, 175, 55, 0.1); padding: 40px; border-radius: 16px;
            border: 2px solid rgba(212, 175, 55, 0.2); position: relative;
        }
        .plan.featured { border-color: #d4af37; }
        .plan-name { font-size: 1.8rem; font-weight: 700; color: #d4af37; margin-bottom: 10px; }
        .plan-price { font-size: 2.5rem; font-weight: 700; margin-bottom: 20px; }
        .plan-price .currency { font-size: 1.2rem; }
        .features { list-style: none; margin-bottom: 30px; }
        .features li { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .btn { 
            display: block; width: 100%; padding: 15px; text-align: center;
            background: linear-gradient(45deg, #d4af37, #ffd700);
            color: #000; text-decoration: none; border-radius: 8px;
            font-weight: 600; margin-bottom: 10px; transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .btn-secondary { background: rgba(212, 175, 55, 0.2); color: #d4af37; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Choose Your Plan</h1>
        <div class="pricing-grid">
            <div class="plan">
                <div class="plan-name">Starter</div>
                <div class="plan-price">£29<span class="currency">/mo</span></div>
                <ul class="features">
                    <li>✓ Basic Booking System</li>
                    <li>✓ Email Notifications</li>
                    <li>✓ 2 Team Members</li>
                    <li>✓ Basic AI Bot</li>
                </ul>
                <a href="/checkout?plan=starter&mode=monthly" class="btn">Start Monthly</a>
                <a href="/checkout?plan=starter&mode=oneoff" class="btn btn-secondary">One-time Purchase</a>
            </div>
            
            <div class="plan featured">
                <div class="plan-name">FlowKit</div>
                <div class="plan-price">£79<span class="currency">/mo</span></div>
                <ul class="features">
                    <li>✓ Advanced AI Scheduler</li>
                    <li>✓ SMS + Email Alerts</li>
                    <li>✓ 5 Team Members</li>
                    <li>✓ Customer Portal</li>
                    <li>✓ Reports & Analytics</li>
                </ul>
                <a href="/checkout?plan=flowkit&mode=monthly" class="btn">Start Monthly</a>
                <a href="/checkout?plan=flowkit&mode=oneoff" class="btn btn-secondary">One-time Purchase</a>
            </div>
            
            <div class="plan">
                <div class="plan-name">LaunchPack</div>
                <div class="plan-price">£199<span class="currency">/mo</span></div>
                <ul class="features">
                    <li>✓ AI Concierge Service</li>
                    <li>✓ Advanced Analytics</li>
                    <li>✓ 15 Team Members</li>
                    <li>✓ Recovery Automations</li>
                    <li>✓ Priority Support</li>
                </ul>
                <a href="/checkout?plan=launchpack&mode=monthly" class="btn">Start Monthly</a>
                <a href="/checkout?plan=launchpack&mode=oneoff" class="btn btn-secondary">One-time Purchase</a>
            </div>
        </div>
    </div>
</body>
</html>"""

@app.route("/")
def home(): 
    return render_template_string(LANDING)

@app.route("/pricing")
def pricing(): 
    return render_template_string(PRICING)

# ---------- Plan gating ----------
@app.route("/feature/<name>")
def feature_access(name):
    user, tenant = get_current_user()
    last = AuditLog.query.filter_by(tenant_id=tenant.id, action="plan_set").order_by(AuditLog.id.desc()).first()
    current_plan = (json.loads(last.audit_metadata).get("plan") if last else "starter")
    ok = name in FEATURES_BY_PLAN.get(current_plan, [])
    return (jsonify({"ok":True,"feature":name,"plan":current_plan})
            if ok else (jsonify({"ok":False,"error":"Upgrade required","plan":current_plan}), 402))

# ---------- Stripe Checkout + Webhook ----------
@app.route("/checkout")
def checkout_redirect():
    plan = request.args.get("plan","starter")
    mode = request.args.get("mode","monthly")
    price_id = _price_for(plan, mode)
    if not price_id: return "Price not configured", 400
    user, tenant = get_current_user()
    session = stripe.checkout.Session.create(
        mode="subscription" if mode=="monthly" else "payment",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=request.host_url + "success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=request.host_url + "pricing",
        customer_email=user.email,
        metadata={"tenant_id":tenant.id,"app_user_id":user.id,"plan":plan,"mode":mode},
    )
    return redirect(session.url, code=303)

@app.route("/success")
def success():
    return "Payment successful — onboarding coming via email. Try /feature/ai_concierge."

@app.route("/webhooks/stripe", methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig = request.headers.get("Stripe-Signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig, Config.STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        return str(e), 400

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        meta = session.get("metadata") or {}
        tenant_id = meta.get("tenant_id")
        plan = meta.get("plan","starter")
        log_action(tenant_id, meta.get("app_user_id"), "plan_set", "tenant", tenant_id, {"plan": plan})

        # Email onboarding (if enabled)
        if notif_ok(tenant_id, "email"):
            try:
                send_email_smtp(session["customer_details"]["email"], "Your SmartFlow plan is live", onboarding_email(plan))
            except Exception as e:
                print("[onboarding email] error:", e)

    return "", 200

# ---------- User Admin: Invite/Accept, List, Update ----------
def generate_invite_token(payload:dict, expires_minutes=30):
    return signer.dumps(payload), datetime.utcnow() + timedelta(minutes=expires_minutes)

@app.route("/tenants/<tenant_id>/invites", methods=['POST'])
@require_admin
def create_invite(tenant_id):
    actor, tenant = get_current_user()
    if tenant_id != tenant.id: return ("Forbidden", 403)
    # plan seat check
    last = AuditLog.query.filter_by(tenant_id=tenant.id, action="plan_set").order_by(AuditLog.id.desc()).first()
    plan = (json.loads(last.audit_metadata).get("plan") if last else "starter")
    if tenant_active_seats(tenant_id) >= seat_limit_for_plan(plan):
        return (jsonify({"ok":False,"error":"Seat limit reached. Upgrade plan."}), 402)
    data = request.get_json() or {}
    email = data.get("email"); role = data.get("role","staff")
    if not email: return ("email required", 400)
    token, exp = generate_invite_token({"tenant_id":tenant_id,"email":email,"role":role})
    inv = Invitation(id=str(uuid.uuid4()), tenant_id=tenant_id, email=email, role=role,
                     token=token, expires_at=exp, inviter_user_id=actor.id)
    db.session.add(inv); db.session.commit()
    link = request.host_url + "auth/accept?token=" + token
    try: send_email_smtp(email, "You're invited to SmartFlow", f"Join: {link}")
    except Exception as e: print("[invite email] error:", e)
    log_action(tenant_id, actor.id, "user.invited", "user", email, {"role":role})
    return jsonify({"ok":True,"invite_link":link})

@app.route("/auth/accept")
def accept_invite():
    token = request.args.get("token")
    try:
        data = signer.loads(token, max_age=60*30)
    except SignatureExpired: return "Invite expired", 410
    except BadSignature: return "Invalid token", 400
    tenant_id = data["tenant_id"]; email = data["email"]; role = data["role"]
    u = User.query.filter_by(email=email).first()
    if not u:
        u = User(id=email, email=email, name=email.split("@")[0])
        db.session.add(u); db.session.commit()
    m = Membership.query.filter_by(tenant_id=tenant_id, user_id=u.id).first()
    if not m:
        m = Membership(tenant_id=tenant_id, user_id=u.id, role=role,
                       invited_at=datetime.utcnow(), activated_at=datetime.utcnow())
        db.session.add(m); db.session.commit()
    log_action(tenant_id, u.id, "user.invite.accepted", "user", u.id, {"role":role})
    return "Invite accepted. You can close this page."

@app.route("/tenants/<tenant_id>/users/<user_id>", methods=['PATCH'])
@require_admin
def change_role_or_suspend(tenant_id, user_id):
    actor, tenant = get_current_user()
    if tenant_id != tenant.id: return ("Forbidden", 403)
    data = request.get_json() or {}
    u = User.query.get(user_id)
    if not u: return ("User not found", 404)
    updates = {}
    if "role" in data:
        m = Membership.query.filter_by(tenant_id=tenant_id, user_id=user_id).first()
        if not m: return ("Membership not found", 404)
        old = m.role; m.role = data["role"]; db.session.commit()
        updates["role_before"] = old; updates["role_after"] = m.role
        log_action(tenant_id, actor.id, "user.role.changed", "user", user_id, updates)
    if "status" in data:
        old = u.status; u.status = data["status"]; db.session.commit()
        updates["status_before"] = old; updates["status_after"] = u.status
        log_action(tenant_id, actor.id, "user.status.changed", "user", user_id, updates)
    return jsonify({"ok":True,"updates":updates})

@app.route("/tenants/<tenant_id>/users")
@require_admin
def list_users(tenant_id):
    rows = (db.session.query(User, Membership)
            .join(Membership, Membership.user_id==User.id)
            .filter(Membership.tenant_id==tenant_id).all())
    out = [{"id":u.id,"email":u.email,"name":u.name,"status":u.status,"role":m.role} for u,m in rows]
    return jsonify(out)

# ---------- Admin Users UI ----------
ADMIN_USERS_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Users</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
            color: #fff; min-height: 100vh; padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { 
            color: #d4af37; margin-bottom: 30px; text-align: center;
            font-size: 2.5rem;
        }
        .invite-form { 
            background: rgba(212, 175, 55, 0.1); padding: 20px; border-radius: 12px;
            margin-bottom: 30px; border: 1px solid rgba(212, 175, 55, 0.2);
        }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; color: #d4af37; }
        input, select { 
            width: 100%; padding: 10px; border: 1px solid rgba(212, 175, 55, 0.3);
            background: rgba(0,0,0,0.5); color: #fff; border-radius: 6px;
        }
        .btn { 
            background: linear-gradient(45deg, #d4af37, #ffd700);
            color: #000; border: none; padding: 10px 20px;
            border-radius: 6px; cursor: pointer; font-weight: 600;
        }
        table { width: 100%; background: rgba(212, 175, 55, 0.1); border-radius: 12px; overflow: hidden; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
        th { background: rgba(212, 175, 55, 0.2); color: #d4af37; }
        .status-active { color: #4ade80; }
        .status-suspended { color: #ef4444; }
    </style>
</head>
<body>
    <div class="container">
        <h1>User Management</h1>
        
        <div class="invite-form">
            <h3 style="color: #d4af37; margin-bottom: 15px;">Invite New User</h3>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="invite-email" placeholder="user@example.com">
            </div>
            <div class="form-group">
                <label>Role</label>
                <select id="invite-role">
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                    <option value="analyst">Analyst</option>
                </select>
            </div>
            <button class="btn" onclick="sendInvite()">Send Invitation</button>
        </div>

        <table id="users-table">
            <thead>
                <tr><th>Email</th><th>Name</th><th>Role</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>

    <script>
        const tenantId = 'demo-tenant';
        
        async function loadUsers() {
            const response = await fetch(`/tenants/${tenantId}/users?p=${getPassword()}`);
            const users = await response.json();
            
            const tbody = document.querySelector('#users-table tbody');
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.email}</td>
                    <td>${user.name || 'N/A'}</td>
                    <td>
                        <select onchange="changeRole('${user.id}', this.value)">
                            <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>Staff</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="analyst" ${user.role === 'analyst' ? 'selected' : ''}>Analyst</option>
                            <option value="owner" ${user.role === 'owner' ? 'selected' : ''}>Owner</option>
                        </select>
                    </td>
                    <td>
                        <span class="status-${user.status}">${user.status}</span>
                    </td>
                    <td>
                        <button class="btn" onclick="toggleStatus('${user.id}', '${user.status}')">
                            ${user.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                    </td>
                </tr>
            `).join('');
        }
        
        async function sendInvite() {
            const email = document.getElementById('invite-email').value;
            const role = document.getElementById('invite-role').value;
            
            const response = await fetch(`/tenants/${tenantId}/invites?p=${getPassword()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role })
            });
            
            const result = await response.json();
            if (result.ok) {
                alert('Invitation sent!');
                document.getElementById('invite-email').value = '';
                loadUsers();
            } else {
                alert('Error: ' + result.error);
            }
        }
        
        async function changeRole(userId, newRole) {
            const response = await fetch(`/tenants/${tenantId}/users/${userId}?p=${getPassword()}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            
            const result = await response.json();
            if (!result.ok) alert('Error updating role');
        }
        
        async function toggleStatus(userId, currentStatus) {
            const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
            
            const response = await fetch(`/tenants/${tenantId}/users/${userId}?p=${getPassword()}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            
            const result = await response.json();
            if (result.ok) {
                loadUsers();
            } else {
                alert('Error updating status');
            }
        }
        
        function getPassword() {
            return new URLSearchParams(window.location.search).get('p') || 'changeme';
        }
        
        loadUsers();
    </script>
</body>
</html>"""

@app.route("/admin/users")
@require_admin
def admin_users_page():
    return ADMIN_USERS_HTML

# ---------- Notifications API + Page ----------
def _admin_override_ok():
    return (request.args.get("p") == Config.ADMIN_PASSWORD) or (request.headers.get("X-Admin-Password") == Config.ADMIN_PASSWORD)

@app.route("/api/tenants/<tenant_id>/notifications")
def get_notifications(tenant_id):
    if not _admin_override_ok():
        u, t = get_current_user()
        if t.id != tenant_id: return ("Forbidden", 403)
    s = get_or_create_notif_settings(tenant_id)
    return {"tenant_id": tenant_id, "email_enabled": s.email_enabled, "sms_enabled": s.sms_enabled,
            "reminder_hours_before": s.reminder_hours_before}

@app.route("/api/tenants/<tenant_id>/notifications", methods=['PUT'])
def update_notifications(tenant_id):
    if not _admin_override_ok():
        u, t = get_current_user()
        if t.id != tenant_id: return ("Forbidden", 403)
    data = request.get_json() or {}
    s = get_or_create_notif_settings(tenant_id)
    if "email_enabled" in data: s.email_enabled = bool(data["email_enabled"])
    if "sms_enabled" in data: s.sms_enabled = bool(data["sms_enabled"])
    if "reminder_hours_before" in data:
        try: s.reminder_hours_before = int(data["reminder_hours_before"])
        except: pass
    db.session.commit()
    log_action(tenant_id, "system", "notifications.updated", "tenant", tenant_id, {
        "email_enabled": s.email_enabled, "sms_enabled": s.sms_enabled,
        "reminder_hours_before": s.reminder_hours_before })
    return {"ok": True}

SETTINGS_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notification Settings</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
            color: #fff; min-height: 100vh; padding: 50px 20px;
        }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { 
            color: #d4af37; margin-bottom: 40px; text-align: center;
            font-size: 2.5rem;
        }
        .settings-card { 
            background: rgba(212, 175, 55, 0.1); padding: 30px; border-radius: 16px;
            border: 1px solid rgba(212, 175, 55, 0.2);
        }
        .setting-group { margin-bottom: 25px; }
        .setting-group label { 
            display: flex; align-items: center; gap: 10px;
            font-size: 1.1rem; cursor: pointer;
        }
        .toggle { 
            width: 50px; height: 26px; background: rgba(255,255,255,0.2);
            border-radius: 13px; position: relative; cursor: pointer;
        }
        .toggle.active { background: #d4af37; }
        .toggle::after {
            content: ''; position: absolute; width: 22px; height: 22px;
            background: white; border-radius: 50%; top: 2px; left: 2px;
            transition: transform 0.2s;
        }
        .toggle.active::after { transform: translateX(24px); }
        .number-input { 
            background: rgba(0,0,0,0.5); border: 1px solid rgba(212, 175, 55, 0.3);
            color: #fff; padding: 10px; border-radius: 6px; width: 80px;
        }
        .btn { 
            background: linear-gradient(45deg, #d4af37, #ffd700);
            color: #000; border: none; padding: 15px 30px;
            border-radius: 8px; cursor: pointer; font-weight: 600;
            width: 100%; font-size: 1.1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Notification Settings</h1>
        
        <div class="settings-card">
            <div class="setting-group">
                <label>
                    <span class="toggle" id="email-toggle" onclick="toggleSetting('email')"></span>
                    Email Notifications
                </label>
            </div>
            
            <div class="setting-group">
                <label>
                    <span class="toggle" id="sms-toggle" onclick="toggleSetting('sms')"></span>
                    SMS Notifications
                </label>
            </div>
            
            <div class="setting-group">
                <label>
                    Reminder timing (hours before):
                    <input type="number" id="hours-input" class="number-input" min="1" max="168" value="24">
                </label>
            </div>
            
            <button class="btn" onclick="saveSettings()">Save Settings</button>
        </div>
    </div>

    <script>
        const tenantId = 'demo-tenant';
        let settings = {};
        
        async function loadSettings() {
            const response = await fetch(`/api/tenants/${tenantId}/notifications?p=${getPassword()}`);
            settings = await response.json();
            
            document.getElementById('email-toggle').classList.toggle('active', settings.email_enabled);
            document.getElementById('sms-toggle').classList.toggle('active', settings.sms_enabled);
            document.getElementById('hours-input').value = settings.reminder_hours_before;
        }
        
        function toggleSetting(type) {
            settings[type + '_enabled'] = !settings[type + '_enabled'];
            document.getElementById(type + '-toggle').classList.toggle('active', settings[type + '_enabled']);
        }
        
        async function saveSettings() {
            settings.reminder_hours_before = parseInt(document.getElementById('hours-input').value);
            
            const response = await fetch(`/api/tenants/${tenantId}/notifications?p=${getPassword()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            
            const result = await response.json();
            if (result.ok) {
                alert('Settings saved!');
            } else {
                alert('Error saving settings');
            }
        }
        
        function getPassword() {
            return new URLSearchParams(window.location.search).get('p') || 'changeme';
        }
        
        loadSettings();
    </script>
</body>
</html>"""

@app.route("/settings/notifications")
def notifications_page():
    return SETTINGS_HTML

# ---------- Bookings API ----------
@app.route("/api/tenants/<tenant_id>/bookings", methods=['POST'])
def create_booking(tenant_id):
    data = request.get_json() or {}
    name = data.get("customer_name","Walk-in")
    email = data.get("customer_email")
    phone = data.get("customer_phone")
    start_at_iso = data.get("start_at")
    if not start_at_iso: return ("start_at (ISO) required", 400)
    try:
        start_at = datetime.fromisoformat(start_at_iso.replace("Z","+00:00")).replace(tzinfo=None)
    except Exception:
        return ("Invalid start_at format", 400)
    b = Booking(id=str(uuid.uuid4())[:12], tenant_id=tenant_id, customer_name=name,
                customer_email=email, customer_phone=phone, start_at=start_at, status="confirmed")
    db.session.add(b); db.session.commit()
    return {"ok": True, "booking_id": b.id}

@app.route("/api/tenants/<tenant_id>/bookings")
def list_bookings(tenant_id):
    now = datetime.utcnow()
    rows = (Booking.query
            .filter(Booking.tenant_id==tenant_id, Booking.start_at >= now, Booking.status=="confirmed")
            .order_by(Booking.start_at.asc()).limit(50).all())
    out = [{"id": b.id, "customer_name": b.customer_name, "email": b.customer_email,
            "phone": b.customer_phone, "start_at": b.start_at.isoformat()+"Z", "status": b.status} for b in rows]
    return out

# ---------- Scheduler: reminder worker ----------
def _send_booking_reminders():
    try:
        now = datetime.utcnow()
        tenant_ids = [t.id for t in Tenant.query.all()]
        for tid in tenant_ids:
            s = get_or_create_notif_settings(tid)
            hours = int(s.reminder_hours_before or 24)
            win_start = now + timedelta(hours=hours)
            win_end   = win_start + timedelta(minutes=5)
            candidates = (Booking.query
                          .filter(Booking.tenant_id==tid, Booking.status=="confirmed",
                                  Booking.start_at >= win_start, Booking.start_at < win_end).all())
            for b in candidates:
                # Email
                if notif_ok(tid, "email") and b.customer_email:
                    already = ReminderLog.query.filter_by(booking_id=b.id, channel="email", kind="before").first()
                    if not already:
                        try:
                            send_email_smtp(b.customer_email, "Appointment reminder",
                                            f"Reminder: {b.customer_name}, you have an appointment at {b.start_at}.")
                            db.session.add(ReminderLog(tenant_id=tid, booking_id=b.id, channel="email", kind="before"))
                            db.session.commit()
                        except Exception as e:
                            print("[reminder/email] error:", e)
                # SMS
                if notif_ok(tid, "sms") and b.customer_phone:
                    already = ReminderLog.query.filter_by(booking_id=b.id, channel="sms", kind="before").first()
                    if not already:
                        if send_sms(b.customer_phone, f"Reminder: your appointment is at {b.start_at}."):
                            db.session.add(ReminderLog(tenant_id=tid, booking_id=b.id, channel="sms", kind="before"))
                            db.session.commit()
    except Exception as e:
        print("[scheduler] loop error:", e)

scheduler = BackgroundScheduler(daemon=True)
scheduler.add_job(_send_booking_reminders, "interval", minutes=5, id="reminders_every_5m", replace_existing=True)
try: scheduler.start()
except Exception as e: print("[scheduler] start error:", e)

# ---------- Test Booking UI ----------
TEST_BOOKING_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Booking</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
            color: #fff; min-height: 100vh; padding: 50px 20px;
        }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { 
            color: #d4af37; margin-bottom: 40px; text-align: center;
            font-size: 2.5rem;
        }
        .booking-form { 
            background: rgba(212, 175, 55, 0.1); padding: 30px; border-radius: 16px;
            border: 1px solid rgba(212, 175, 55, 0.2);
        }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; color: #d4af37; font-weight: 600; }
        input { 
            width: 100%; padding: 12px; border: 1px solid rgba(212, 175, 55, 0.3);
            background: rgba(0,0,0,0.5); color: #fff; border-radius: 8px;
        }
        input:focus { 
            border-color: #d4af37; outline: none; 
            box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
        }
        .btn { 
            background: linear-gradient(45deg, #d4af37, #ffd700);
            color: #000; border: none; padding: 15px 30px;
            border-radius: 8px; cursor: pointer; font-weight: 600;
            width: 100%; font-size: 1.1rem;
        }
        .btn:hover { transform: translateY(-2px); }
        .bookings-list { 
            margin-top: 40px; background: rgba(212, 175, 55, 0.1);
            padding: 20px; border-radius: 12px; border: 1px solid rgba(212, 175, 55, 0.2);
        }
        .booking-item { 
            padding: 15px; margin-bottom: 10px; background: rgba(0,0,0,0.3);
            border-radius: 8px; border-left: 4px solid #d4af37;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test Booking System</h1>
        
        <div class="booking-form">
            <div class="form-group">
                <label>Customer Name</label>
                <input type="text" id="customer-name" placeholder="John Doe" required>
            </div>
            
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="customer-email" placeholder="john@example.com">
            </div>
            
            <div class="form-group">
                <label>Phone</label>
                <input type="tel" id="customer-phone" placeholder="+44 123 456 7890">
            </div>
            
            <div class="form-group">
                <label>Appointment Date & Time</label>
                <input type="datetime-local" id="start-time" required>
            </div>
            
            <button class="btn" onclick="createBooking()">Book Appointment</button>
        </div>
        
        <div class="bookings-list">
            <h3 style="color: #d4af37; margin-bottom: 15px;">Upcoming Bookings</h3>
            <div id="bookings-container">Loading...</div>
        </div>
    </div>

    <script>
        const tenantId = 'demo-tenant';
        
        // Set default datetime to tomorrow at 10 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        document.getElementById('start-time').value = tomorrow.toISOString().slice(0, 16);
        
        async function createBooking() {
            const name = document.getElementById('customer-name').value;
            const email = document.getElementById('customer-email').value;
            const phone = document.getElementById('customer-phone').value;
            const startTime = document.getElementById('start-time').value;
            
            if (!name || !startTime) {
                alert('Name and appointment time are required');
                return;
            }
            
            const booking = {
                customer_name: name,
                customer_email: email,
                customer_phone: phone,
                start_at: new Date(startTime).toISOString()
            };
            
            try {
                const response = await fetch(`/api/tenants/${tenantId}/bookings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(booking)
                });
                
                const result = await response.json();
                if (result.ok) {
                    alert('Booking created successfully!');
                    document.getElementById('customer-name').value = '';
                    document.getElementById('customer-email').value = '';
                    document.getElementById('customer-phone').value = '';
                    loadBookings();
                } else {
                    alert('Error creating booking');
                }
            } catch (error) {
                alert('Network error: ' + error.message);
            }
        }
        
        async function loadBookings() {
            try {
                const response = await fetch(`/api/tenants/${tenantId}/bookings`);
                const bookings = await response.json();
                
                const container = document.getElementById('bookings-container');
                if (bookings.length === 0) {
                    container.innerHTML = '<p style="color: #ccc;">No upcoming bookings</p>';
                } else {
                    container.innerHTML = bookings.map(booking => `
                        <div class="booking-item">
                            <strong>${booking.customer_name}</strong><br>
                            <span style="color: #ccc;">${booking.email || 'No email'}</span><br>
                            <span style="color: #ccc;">${booking.phone || 'No phone'}</span><br>
                            <span style="color: #d4af37;">${new Date(booking.start_at).toLocaleString()}</span>
                        </div>
                    `).join('');
                }
            } catch (error) {
                document.getElementById('bookings-container').innerHTML = '<p style="color: #ef4444;">Error loading bookings</p>';
            }
        }
        
        loadBookings();
    </script>
</body>
</html>"""

@app.route("/test/booking")
def test_booking_page():
    return TEST_BOOKING_HTML

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 3000)))