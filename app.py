import os, json, uuid, base64, random
from datetime import datetime, timedelta
from functools import wraps
from typing import List
from flask import Flask, request, jsonify, render_template_string, redirect, send_from_directory, render_template
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from pydantic import BaseModel, Field
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

# Static directory (for your logo)
@app.get("/static/<path:filename>")
def static_files(filename):
    return send_from_directory("static", filename)

db.init_app(app)
with app.app_context():
    db.create_all()
    # The logo is already created, so we don't need to create a placeholder

stripe.api_key = Config.STRIPE_SECRET_KEY
signer = URLSafeTimedSerializer(app.secret_key)

# Start scheduler
scheduler = BackgroundScheduler()
scheduler.start()

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
                   target_type=target_type, target_id=target_id, details=json.dumps(metadata or {}))
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

# ---------- Landing & Pricing HTML Templates ----------
LANDING_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartFlow Systems</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #fff; min-height: 100vh; }
        .header { background: rgba(0, 0, 0, 0.9); border-bottom: 2px solid #ffd700; padding: 1rem 0; text-align: center; }
        .logo { height: 64px; margin: 0 auto 8px; display: block; }
        .header h1 { color: #ffd700; font-size: 2rem; font-weight: 300; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
        .nav { margin-top: 1rem; }
        .nav a { color: #fff; text-decoration: none; margin: 0 1rem; padding: 0.5rem 1rem; border-radius: 4px; transition: background-color 0.3s; }
        .nav a:hover { background-color: rgba(255, 215, 0, 0.1); }
        .hero { text-align: center; padding: 4rem 2rem; }
        .hero h2 { color: #ffd700; font-size: 3rem; margin-bottom: 2rem; }
        .hero p { font-size: 1.5rem; margin-bottom: 3rem; line-height: 1.6; }
        .features { background: rgba(255, 215, 0, 0.1); border: 1px solid #ffd700; border-radius: 8px; padding: 2rem; margin: 2rem 0; }
        .features h3 { color: #ffd700; margin-bottom: 1rem; }
        .features ul { list-style: none; padding: 0; }
        .features li { margin: 1rem 0; font-size: 1.2rem; }
        .cta { display: inline-block; background: #ffd700; color: #000; padding: 1rem 2rem; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 1.2rem; margin-top: 2rem; }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <img class="logo" src="/static/logo.png" alt="SmartFlow Systems" style="height:64px;margin:0 auto 8px;display:block">
            <h1>SmartFlow Systems</h1>
            <nav class="nav">
                <a href="/">Home</a>
                <a href="/pricing">Pricing</a>
                <a href="/admin?p=changeme">Admin</a>
                <a href="/test-booking">Test Booking</a>
            </nav>
        </div>
    </header>
    <main>
        <div class="container hero">
            <h2>Welcome to SmartFlow Systems</h2>
            <p>Streamline your business operations with our powerful automation and booking platform.</p>
            <div class="features">
                <h3>Key Features</h3>
                <ul>
                    <li>✨ Automated Booking Management</li>
                    <li>📧 Smart Email & SMS Notifications</li>
                    <li>⚡ Real-time Analytics Dashboard</li>
                    <li>🔒 Secure Multi-tenant Architecture</li>
                    <li>👥 Team Management & Role-based Access</li>
                    <li>📅 APScheduler Reminders (12/24/48h before)</li>
                </ul>
            </div>
            <a href="/pricing" class="cta">View Pricing Plans</a>
        </div>
    </main>
</body>
</html>
"""

PRICING_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartFlow Systems - Pricing</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #fff; min-height: 100vh; }
        .header { background: rgba(0, 0, 0, 0.9); border-bottom: 2px solid #ffd700; padding: 1rem 0; text-align: center; }
        .logo { height: 64px; margin: 0 auto 8px; display: block; }
        .header h1 { color: #ffd700; font-size: 2rem; font-weight: 300; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
        .nav { margin-top: 1rem; }
        .nav a { color: #fff; text-decoration: none; margin: 0 1rem; padding: 0.5rem 1rem; border-radius: 4px; transition: background-color 0.3s; }
        .nav a:hover { background-color: rgba(255, 215, 0, 0.1); }
        .pricing-section { padding: 4rem 2rem; }
        .pricing-section h2 { color: #ffd700; font-size: 3rem; margin-bottom: 3rem; text-align: center; }
        .plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 1000px; margin: 0 auto; }
        .plan { background: rgba(255, 215, 0, 0.1); border: 2px solid #ffd700; border-radius: 12px; padding: 2rem; text-align: center; }
        .plan.popular { background: rgba(255, 215, 0, 0.2); border: 3px solid #ffd700; transform: scale(1.05); }
        .plan h3 { color: #ffd700; font-size: 1.8rem; margin-bottom: 1rem; }
        .plan .price { font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; }
        .plan ul { list-style: none; padding: 0; margin-bottom: 2rem; }
        .plan li { margin: 0.8rem 0; }
        .plan button { background: #ffd700; color: #000; border: none; padding: 1rem 2rem; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; }
        .badge { background: #ffd700; color: #000; padding: 0.5rem; border-radius: 20px; font-weight: bold; margin-bottom: 1rem; }
        .toggle { text-align: center; margin-bottom: 2rem; }
        .toggle button { background: rgba(255, 215, 0, 0.2); color: #fff; border: 1px solid #ffd700; padding: 0.5rem 1rem; margin: 0 0.5rem; cursor: pointer; }
        .toggle button.active { background: #ffd700; color: #000; }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <img class="logo" src="/static/logo.png" alt="SmartFlow Systems" style="height:64px;margin:0 auto 8px;display:block">
            <h1>SmartFlow Systems</h1>
            <nav class="nav">
                <a href="/">Home</a>
                <a href="/pricing">Pricing</a>
                <a href="/admin?p=changeme">Admin</a>
                <a href="/test-booking">Test Booking</a>
            </nav>
        </div>
    </header>
    <main>
        <div class="container pricing-section">
            <h2>Choose Your Plan</h2>
            <div class="toggle">
                <button id="monthly-btn" class="active" onclick="toggleMode('monthly')">Monthly</button>
                <button id="oneoff-btn" onclick="toggleMode('oneoff')">One-time</button>
            </div>
            <div class="plans">
                <div class="plan">
                    <h3>Starter</h3>
                    <p class="price" id="starter-price">£29<span style="font-size: 1rem;">/month</span></p>
                    <ul>
                        <li>✓ Basic Booking System</li>
                        <li>✓ Email Notifications</li>
                        <li>✓ 2 Team Members</li>
                        <li>✓ Basic Templates</li>
                        <li>✓ One Template Access</li>
                    </ul>
                    <button onclick="checkout('starter', currentMode)">Get Started</button>
                </div>
                <div class="plan popular">
                    <div class="badge">MOST POPULAR</div>
                    <h3>FlowKit</h3>
                    <p class="price" id="flowkit-price">£79<span style="font-size: 1rem;">/month</span></p>
                    <ul>
                        <li>✓ Advanced AI Scheduler</li>
                        <li>✓ SMS & Email Notifications</li>
                        <li>✓ 5 Team Members</li>
                        <li>✓ Customer Portal</li>
                        <li>✓ Analytics & Reports</li>
                        <li>✓ Two Templates Access</li>
                    </ul>
                    <button onclick="checkout('flowkit', currentMode)">Get Started</button>
                </div>
                <div class="plan">
                    <h3>LaunchPack</h3>
                    <p class="price" id="launchpack-price">£199<span style="font-size: 1rem;">/month</span></p>
                    <ul>
                        <li>✓ Everything in FlowKit</li>
                        <li>✓ AI Concierge</li>
                        <li>✓ 15 Team Members</li>
                        <li>✓ Advanced Analytics</li>
                        <li>✓ Priority Support</li>
                        <li>✓ Custom Automations</li>
                        <li>✓ Three Templates Access</li>
                    </ul>
                    <button onclick="checkout('launchpack', currentMode)">Get Started</button>
                </div>
            </div>
        </div>
    </main>
    <script>
        let currentMode = 'monthly';
        const pricing = {
            monthly: { starter: '£29', flowkit: '£79', launchpack: '£199' },
            oneoff: { starter: '£299', flowkit: '£799', launchpack: '£1999' }
        };
        
        function toggleMode(mode) {
            currentMode = mode;
            document.getElementById('monthly-btn').classList.toggle('active', mode === 'monthly');
            document.getElementById('oneoff-btn').classList.toggle('active', mode === 'oneoff');
            
            document.getElementById('starter-price').innerHTML = pricing[mode].starter + (mode === 'monthly' ? '<span style="font-size: 1rem;">/month</span>' : '<span style="font-size: 1rem;"> one-time</span>');
            document.getElementById('flowkit-price').innerHTML = pricing[mode].flowkit + (mode === 'monthly' ? '<span style="font-size: 1rem;">/month</span>' : '<span style="font-size: 1rem;"> one-time</span>');
            document.getElementById('launchpack-price').innerHTML = pricing[mode].launchpack + (mode === 'monthly' ? '<span style="font-size: 1rem;">/month</span>' : '<span style="font-size: 1rem;"> one-time</span>');
        }
        
        function checkout(plan, mode) {
            window.location.href = `/checkout?plan=${plan}&mode=${mode}`;
        }
    </script>
</body>
</html>
"""

# ---------- UI Routes ----------
@app.get("/")
def home():
    """Serve the new PWA interface"""
    try:
        with open('index.html', 'r') as f:
            return f.read()
    except FileNotFoundError:
        return render_template_string(LANDING_HTML)

@app.get("/pricing")
def pricing():
    """Legacy pricing route - redirect to PWA with anchor"""
    return redirect("/#pricing")

# ---------- Original Flask Admin Routes ----------
# PWA Service Worker and Manifest routes
@app.route("/sw.js")
def service_worker():
    """Serve the service worker"""
    try:
        with open('sw.js', 'r') as f:
            content = f.read()
        response = app.make_response(content)
        response.headers['Content-Type'] = 'application/javascript'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except FileNotFoundError:
        return "Service worker not found", 404

@app.route("/manifest.webmanifest")
def manifest():
    """Serve the PWA manifest"""
    try:
        with open('manifest.webmanifest', 'r') as f:
            content = f.read()
        response = app.make_response(content)
        response.headers['Content-Type'] = 'application/manifest+json'
        return response
    except FileNotFoundError:
        return "Manifest not found", 404

@app.route("/offline.html")
def offline():
    """Serve the offline fallback page"""
    try:
        with open('offline.html', 'r') as f:
            return f.read()
    except FileNotFoundError:
        return "Offline page not found", 404

# Serve PWA files (styles.css, script.js, index.html)
@app.route("/styles.css")
def serve_styles():
    try:
        with open('styles.css', 'r') as f:
            content = f.read()
        response = app.make_response(content)
        response.headers['Content-Type'] = 'text/css'
        return response
    except FileNotFoundError:
        return "Styles not found", 404

@app.route("/script.js") 
def serve_script():
    try:
        with open('script.js', 'r') as f:
            content = f.read()
        response = app.make_response(content)
        response.headers['Content-Type'] = 'application/javascript'
        return response
    except FileNotFoundError:
        return "Script not found", 404

@app.route("/index.html")
def serve_index():
    try:
        with open('index.html', 'r') as f:
            return f.read()
    except FileNotFoundError:
        return "Index not found", 404

# Serve assets directory
@app.route("/assets/<path:filename>")
def serve_assets(filename):
    return send_from_directory("assets", filename)

# ========== API Tester Integration ==========
# Models for API
class GenerateRequest(BaseModel):
    topic: str = Field(..., description="Post topic")
    tone: str = Field("friendly", description="helpful|concise|friendly|bold")
    platform: str = Field("X", description="X|LinkedIn")
    count: int = Field(3, ge=1, le=10)
    niche: str = Field("local services")

class PostOut(BaseModel):
    text: str
    alt_text: str
    suggested_image: str
    hashtags: List[str]

# Content generation helpers
HOOKS = [
  "Stop guessing. Start scaling.",
  "Your customers are online—are you?",
  "Automation that pays for itself.",
  "Turn followers into bookings.",
  "Make your operations feel effortless."
]

CTAS = [
  "Book a free 10-min demo.",
  "DM 'FLOW' to get started.",
  "Grab your spot for a quick walkthrough.",
  "Try the live demo—no card needed."
]

IMG_SUGGESTIONS = [
  "Dark UI mockup with gold accents",
  "Before/after metrics dashboard",
  "Booking calendar close-up",
  "AI chat widget on a website",
  "Hands on keyboard, gold lighting"
]

def platform_limit(platform:str)->int:
    return 280 if platform.upper()=="X" else 3000

def pick_hashtags(niche:str, platform:str)->List[str]:
    base = [
      f"#{niche.replace(' ','')}",
      "#SmartFlowSystems",
      "#Automation",
      "#SmallBusiness",
      "#Growth",
      "#AIforBusiness"
    ]
    random.shuffle(base)
    k = random.choice([3,4,5,6])
    return base[:k]

def make_post(topic:str, tone:str, platform:str, niche:str)->PostOut:
    hook = random.choice(HOOKS)
    benefit = "Save hours weekly and convert more leads"
    proof = "Used by UK SMBs across services, fitness, trades, and local retail"
    cta = random.choice(CTAS)

    body = f"{hook}\n{topic}—{benefit}. Proof: {proof}. {cta}"
    limit = platform_limit(platform)
    text = (body[:limit-1] + "…") if len(body) > limit else body

    return PostOut(
      text=text,
      alt_text=f"{platform} post: {topic} in {niche}, tone {tone}.",
      suggested_image=random.choice(IMG_SUGGESTIONS),
      hashtags=pick_hashtags(niche, platform)
    )

# API endpoint for post generation
@app.post("/api/generate_posts")
def generate_posts():
    try:
      data = request.get_json(force=True) or {}
      req = GenerateRequest(**data)
    except Exception as e:
      return jsonify({"error": str(e)}), 400

    posts = [make_post(req.topic, req.tone, req.platform, req.niche).model_dump() for _ in range(req.count)]
    return jsonify({"platform": req.platform, "count": req.count, "posts": posts})

# Browser tester page
@app.get("/tester")
def tester():
    APP_NAME = "SmartFlow Systems"
    THEME = {"bg":"#0b0b0b","gold":"#d4af37","text":"#f2f2f2"}
    return render_template("tester.html", app_name=APP_NAME, theme=THEME)

# AI Chat page
@app.get("/chat")
def chat_page():
    """Serve the AI Chat widget interface"""
    APP_NAME = "SmartFlow Systems"
    THEME = {"bg":"#0b0b0b","gold":"#d4af37","text":"#f2f2f2"}
    return render_template("chat.html", app_name=APP_NAME, theme=THEME)

# ---------- Plan gating ----------
@app.get("/feature/<name>")
def feature_access(name):
    user, tenant = get_current_user()
    last = AuditLog.query.filter_by(tenant_id=tenant.id, action="plan_set").order_by(AuditLog.id.desc()).first()
    current_plan = (json.loads(last.details).get("plan") if last else "starter")
    ok = name in FEATURES_BY_PLAN.get(current_plan, [])
    return (jsonify({"ok":True,"feature":name,"plan":current_plan})
            if ok else (jsonify({"ok":False,"error":"Upgrade required","plan":current_plan}), 402))

# ---------- Stripe Checkout + Webhook ----------
@app.get("/checkout")
def checkout_redirect():
    plan = request.args.get("plan","starter")
    mode = request.args.get("mode","monthly")
    price_id = _price_for(plan, mode)
    if not price_id: 
        return f"Price not configured for {plan} {mode}. Set STRIPE_PRICE_{plan.upper()}_{mode.upper()} environment variable.", 400
    user, tenant = get_current_user()
    try:
        session = stripe.checkout.Session.create(
            mode="subscription" if mode=="monthly" else "payment",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=request.host_url + "success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=request.host_url + "pricing",
            customer_email=user.email,
            metadata={"tenant_id":tenant.id,"app_user_id":user.id,"plan":plan,"mode":mode},
        )
        return redirect(session.url, code=303)
    except Exception as e:
        return f"Stripe error: {e}", 400

@app.get("/success")
def success():
    return "Payment successful — onboarding coming via email. Try /feature/ai_concierge."

@app.post("/webhooks/stripe")
def stripe_webhook():
    payload = request.data
    sig = request.headers.get("Stripe-Signature")
    if not Config.STRIPE_WEBHOOK_SECRET:
        return "Webhook secret not configured", 400
    try:
        event = stripe.Webhook.construct_event(payload, sig, Config.STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        return str(e), 400

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        meta = session.get("metadata") or {}
        tenant_id = meta.get("tenant_id")
        plan = meta.get("plan", "starter")
        if tenant_id:
            log_action(tenant_id, meta.get("app_user_id"), "plan_set", "tenant", tenant_id, {"plan": plan})
            # Send onboarding email
            user = User.query.filter_by(id=meta.get("app_user_id")).first()
            if user:
                try:
                    send_email_smtp(user.email, f"Welcome to SmartFlow {plan.title()}!", onboarding_email(plan))
                except Exception as e:
                    print(f"Email failed: {e}")
    return "", 200

# ---------- Admin UI ----------
ADMIN_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartFlow Admin</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #fff; min-height: 100vh; padding: 2rem; }
        .header { background: rgba(0, 0, 0, 0.9); border-bottom: 2px solid #ffd700; padding: 1rem 0; text-align: center; margin-bottom: 2rem; }
        .logo { height: 64px; margin: 0 auto 8px; display: block; }
        .header h1 { color: #ffd700; font-size: 2rem; font-weight: 300; }
        .container { max-width: 1200px; margin: 0 auto; }
        .section { background: rgba(255, 215, 0, 0.1); border: 1px solid #ffd700; border-radius: 8px; padding: 2rem; margin: 2rem 0; }
        .section h2 { color: #ffd700; margin-bottom: 1rem; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 0.5rem; border: 1px solid #ffd700; text-align: left; }
        th { background: rgba(255, 215, 0, 0.2); }
        .form-group { margin: 1rem 0; }
        .form-group label { display: block; margin-bottom: 0.5rem; color: #ffd700; }
        .form-group input, .form-group select { width: 100%; padding: 0.5rem; background: rgba(0, 0, 0, 0.3); border: 1px solid #ffd700; color: #fff; border-radius: 4px; }
        .btn { background: #ffd700; color: #000; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin: 0.5rem; }
        .btn:hover { background: #ffed4a; }
    </style>
</head>
<body>
    <header class="header">
        <img class="logo" src="/static/logo.png" alt="SmartFlow Systems" style="height:64px;margin:0 auto 8px;display:block">
        <h1>SmartFlow Admin</h1>
    </header>
    <div class="container">
        <div class="section">
            <h2>Tenant Management</h2>
            <table>
                <thead>
                    <tr><th>ID</th><th>Name</th><th>Owner</th><th>Created</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    {% for tenant in tenants %}
                    <tr>
                        <td>{{ tenant.id }}</td>
                        <td>{{ tenant.name }}</td>
                        <td>{{ tenant.owner_user_id }}</td>
                        <td>{{ tenant.created_at.strftime('%Y-%m-%d') }}</td>
                        <td>
                            <button class="btn" onclick="viewTenant('{{ tenant.id }}')">View</button>
                        </td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>User Management</h2>
            <table>
                <thead>
                    <tr><th>ID</th><th>Email</th><th>Name</th><th>Status</th><th>Created</th></tr>
                </thead>
                <tbody>
                    {% for user in users %}
                    <tr>
                        <td>{{ user.id }}</td>
                        <td>{{ user.email }}</td>
                        <td>{{ user.name or 'N/A' }}</td>
                        <td>{{ user.status }}</td>
                        <td>{{ user.created_at.strftime('%Y-%m-%d') }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>Recent Bookings</h2>
            <table>
                <thead>
                    <tr><th>ID</th><th>Customer</th><th>Email</th><th>Phone</th><th>Start Time</th><th>Status</th></tr>
                </thead>
                <tbody>
                    {% for booking in bookings %}
                    <tr>
                        <td>{{ booking.id }}</td>
                        <td>{{ booking.customer_name or 'N/A' }}</td>
                        <td>{{ booking.customer_email or 'N/A' }}</td>
                        <td>{{ booking.customer_phone or 'N/A' }}</td>
                        <td>{{ booking.start_at.strftime('%Y-%m-%d %H:%M') if booking.start_at else 'N/A' }}</td>
                        <td>{{ booking.status }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
"""

@app.get("/admin")
@require_admin
def admin_dashboard():
    tenants = Tenant.query.order_by(Tenant.created_at.desc()).limit(10).all()
    users = User.query.order_by(User.created_at.desc()).limit(10).all()
    bookings = Booking.query.order_by(Booking.created_at.desc()).limit(10).all()
    return render_template_string(ADMIN_HTML, tenants=tenants, users=users, bookings=bookings)

# ---------- Booking System ----------
TEST_BOOKING_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Booking - SmartFlow Systems</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #fff; min-height: 100vh; }
        .header { background: rgba(0, 0, 0, 0.9); border-bottom: 2px solid #ffd700; padding: 1rem 0; text-align: center; }
        .logo { height: 64px; margin: 0 auto 8px; display: block; }
        .header h1 { color: #ffd700; font-size: 2rem; font-weight: 300; }
        .container { max-width: 800px; margin: 0 auto; padding: 2rem; }
        .section { background: rgba(255, 215, 0, 0.1); border: 1px solid #ffd700; border-radius: 8px; padding: 2rem; margin: 2rem 0; }
        .section h2 { color: #ffd700; margin-bottom: 1rem; }
        .form-group { margin: 1rem 0; }
        .form-group label { display: block; margin-bottom: 0.5rem; color: #ffd700; }
        .form-group input, .form-group select { width: 100%; padding: 0.8rem; background: rgba(0, 0, 0, 0.3); border: 1px solid #ffd700; color: #fff; border-radius: 4px; }
        .btn { background: #ffd700; color: #000; border: none; padding: 1rem 2rem; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn:hover { background: #ffed4a; }
        .nav a { color: #fff; text-decoration: none; margin: 0 1rem; padding: 0.5rem 1rem; border-radius: 4px; transition: background-color 0.3s; }
        .nav a:hover { background-color: rgba(255, 215, 0, 0.1); }
    </style>
</head>
<body>
    <header class="header">
        <img class="logo" src="/static/logo.png" alt="SmartFlow Systems" style="height:64px;margin:0 auto 8px;display:block">
        <h1>SmartFlow Systems</h1>
        <nav class="nav">
            <a href="/">Home</a>
            <a href="/pricing">Pricing</a>
            <a href="/test-booking">Test Booking</a>
        </nav>
    </header>
    <div class="container">
        <div class="section">
            <h2>Book a Test Appointment</h2>
            <form id="booking-form">
                <div class="form-group">
                    <label for="customer_name">Customer Name:</label>
                    <input type="text" id="customer_name" name="customer_name" required>
                </div>
                <div class="form-group">
                    <label for="customer_email">Email:</label>
                    <input type="email" id="customer_email" name="customer_email" required>
                </div>
                <div class="form-group">
                    <label for="customer_phone">Phone:</label>
                    <input type="tel" id="customer_phone" name="customer_phone">
                </div>
                <div class="form-group">
                    <label for="start_at">Appointment Date & Time:</label>
                    <input type="datetime-local" id="start_at" name="start_at" required>
                </div>
                <button type="submit" class="btn">Book Appointment</button>
            </form>
        </div>
        <div class="section">
            <h2>Settings & Notifications</h2>
            <form id="settings-form">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="email_enabled" checked> Email Notifications
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="sms_enabled"> SMS Notifications
                    </label>
                </div>
                <div class="form-group">
                    <label for="reminder_hours">Reminder Hours Before:</label>
                    <select id="reminder_hours">
                        <option value="12">12 hours</option>
                        <option value="24" selected>24 hours</option>
                        <option value="48">48 hours</option>
                    </select>
                </div>
                <button type="submit" class="btn">Update Settings</button>
            </form>
        </div>
    </div>
    <script>
        document.getElementById('booking-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            try {
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                alert(response.ok ? 'Booking created successfully!' : `Error: ${result.error}`);
                if (response.ok) e.target.reset();
            } catch (error) {
                alert('Network error');
            }
        });
        
        document.getElementById('settings-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                email_enabled: document.getElementById('email_enabled').checked,
                sms_enabled: document.getElementById('sms_enabled').checked,
                reminder_hours_before: parseInt(document.getElementById('reminder_hours').value)
            };
            
            try {
                const response = await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                alert(response.ok ? 'Settings updated!' : 'Error updating settings');
            } catch (error) {
                alert('Network error');
            }
        });
    </script>
</body>
</html>
"""

@app.get("/test-booking")
def test_booking_page():
    return render_template_string(TEST_BOOKING_HTML)

# ---------- API Routes ----------
@app.post("/api/bookings")
def create_booking():
    user, tenant = get_current_user()
    data = request.get_json()
    
    booking = Booking(
        id=str(uuid.uuid4()),
        tenant_id=tenant.id,
        customer_name=data.get("customer_name"),
        customer_email=data.get("customer_email"),
        customer_phone=data.get("customer_phone"),
        start_at=datetime.fromisoformat(data.get("start_at")),
        status="confirmed"
    )
    
    db.session.add(booking)
    db.session.commit()
    
    log_action(tenant.id, user.id, "booking_created", "booking", booking.id, {
        "customer_email": booking.customer_email,
        "start_at": booking.start_at.isoformat()
    })
    
    # Schedule reminders
    schedule_reminders(booking)
    
    return jsonify({"success": True, "booking_id": booking.id})

@app.post("/api/settings")
def update_settings():
    user, tenant = get_current_user()
    data = request.get_json()
    
    settings = get_or_create_notif_settings(tenant.id)
    settings.email_enabled = data.get("email_enabled", True)
    settings.sms_enabled = data.get("sms_enabled", False)
    settings.reminder_hours_before = data.get("reminder_hours_before", 24)
    
    db.session.commit()
    
    log_action(tenant.id, user.id, "settings_updated", "tenant", tenant.id, data)
    
    return jsonify({"success": True})

# ---------- Scheduler Functions ----------
def schedule_reminders(booking):
    """Schedule reminder notifications for a booking"""
    user, tenant = get_current_user()
    settings = get_or_create_notif_settings(tenant.id)
    
    # Calculate reminder time
    reminder_time = booking.start_at - timedelta(hours=settings.reminder_hours_before)
    
    if reminder_time > datetime.utcnow():
        # Schedule email reminder
        if notif_ok(tenant.id, "email") and booking.customer_email:
            scheduler.add_job(
                send_reminder_email,
                'date',
                run_date=reminder_time,
                args=[booking.id],
                id=f"email_reminder_{booking.id}"
            )
        
        # Schedule SMS reminder
        if notif_ok(tenant.id, "sms") and booking.customer_phone:
            scheduler.add_job(
                send_reminder_sms,
                'date',
                run_date=reminder_time,
                args=[booking.id],
                id=f"sms_reminder_{booking.id}"
            )

def send_reminder_email(booking_id):
    """Send email reminder for a booking"""
    booking = Booking.query.get(booking_id)
    if not booking or booking.status != "confirmed":
        return
    
    # Check if already sent
    existing = ReminderLog.query.filter_by(
        booking_id=booking_id, 
        channel="email", 
        kind="before"
    ).first()
    if existing:
        return
    
    subject = "Appointment Reminder - SmartFlow Systems"
    body = f"""Hello {booking.customer_name or 'Customer'},

This is a reminder for your upcoming appointment:

Date & Time: {booking.start_at.strftime('%Y-%m-%d %H:%M')}

Thank you for choosing SmartFlow Systems!

Best regards,
SmartFlow Team
"""
    
    try:
        send_email_smtp(booking.customer_email, subject, body)
        # Log the reminder
        log = ReminderLog(
            tenant_id=booking.tenant_id,
            booking_id=booking_id,
            channel="email",
            kind="before"
        )
        db.session.add(log)
        db.session.commit()
        print(f"Email reminder sent for booking {booking_id}")
    except Exception as e:
        print(f"Failed to send email reminder: {e}")

def send_reminder_sms(booking_id):
    """Send SMS reminder for a booking"""
    booking = Booking.query.get(booking_id)
    if not booking or booking.status != "confirmed":
        return
    
    # Check if already sent
    existing = ReminderLog.query.filter_by(
        booking_id=booking_id, 
        channel="sms", 
        kind="before"
    ).first()
    if existing:
        return
    
    message = f"Hi {booking.customer_name or 'Customer'}, reminder: your appointment is on {booking.start_at.strftime('%Y-%m-%d %H:%M')}. SmartFlow Systems"
    
    try:
        if send_sms(booking.customer_phone, message):
            # Log the reminder
            log = ReminderLog(
                tenant_id=booking.tenant_id,
                booking_id=booking_id,
                channel="sms",
                kind="before"
            )
            db.session.add(log)
            db.session.commit()
            print(f"SMS reminder sent for booking {booking_id}")
    except Exception as e:
        print(f"Failed to send SMS reminder: {e}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)