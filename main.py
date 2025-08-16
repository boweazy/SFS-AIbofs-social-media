from __future__ import annotations

import os
import json
import math
import re
import threading
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Tuple

from flask import Flask, request, jsonify, send_from_directory

# Absolute paths (why: avoid 500 when CWD differs)
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DATA_FILE = BASE_DIR / "data.json"

# Env config
APP_ENV = os.getenv("APP_ENV", "dev")
RUN_SCHED = os.getenv("RUN_SCHEDULER", "true").lower() == "true"
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "").lower()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
LLM_INPUT_COST_PER_1K_GBP = float(os.getenv("LLM_INPUT_COST_PER_1K_GBP", "0.002"))
LLM_OUTPUT_COST_PER_1K_GBP = float(os.getenv("LLM_OUTPUT_COST_PER_1K_GBP", "0.006"))

# ---------- Data ----------
@dataclass
class PostRecord:
    id: int
    platform: str
    content: str
    status: Literal["draft", "scheduled", "published", "failed"] = "scheduled"
    scheduled_time: Optional[str] = None
    external_id: Optional[str] = None
    error: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

@dataclass
class FeedbackRecord:
    id: int
    user: Optional[str]
    message: str
    meta: Optional[Dict[str, Any]] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

@dataclass
class State:
    next_post_id: int = 1
    posts: List[PostRecord] = field(default_factory=list)
    accounts: Dict[str, Dict[str, Optional[str]]] = field(default_factory=dict)
    next_feedback_id: int = 1
    feedback: List[FeedbackRecord] = field(default_factory=list)

class Store:
    """Single-file store (why: zero-setup DB)."""
    def __init__(self, file: Path):
        self.file = file
        self.lock = threading.Lock()
        if not file.exists():
            self._write(State())

    def _read(self) -> State:
        try:
            raw = json.loads(self.file.read_text() or "{}")
        except (FileNotFoundError, json.JSONDecodeError):
            return State()
        if not raw:
            return State()
        posts = [PostRecord(**p) for p in raw.get("posts", [])]
        fb = [FeedbackRecord(**f) for f in raw.get("feedback", [])]
        return State(
            next_post_id=raw.get("next_post_id", 1),
            posts=posts,
            accounts=raw.get("accounts", {}),
            next_feedback_id=raw.get("next_feedback_id", 1),
            feedback=fb,
        )

    def _write(self, state: State) -> None:
        payload = {
            "next_post_id": state.next_post_id,
            "posts": [asdict(p) for p in state.posts],
            "accounts": state.accounts,
            "next_feedback_id": state.next_feedback_id,
            "feedback": [asdict(f) for f in state.feedback],
        }
        self.file.write_text(json.dumps(payload, ensure_ascii=False, indent=2))

    def add_post(self, rec: PostRecord) -> PostRecord:
        with self.lock:
            s = self._read()
            rec.id = s.next_post_id
            s.next_post_id += 1
            s.posts.append(rec)
            self._write(s)
            return rec

    def update_post(self, rec: PostRecord) -> None:
        with self.lock:
            s = self._read()
            for i, p in enumerate(s.posts):
                if p.id == rec.id:
                    s.posts[i] = rec
                    break
            self._write(s)

    def list_posts(self, status: Optional[str] = None) -> List[PostRecord]:
        with self.lock:
            s = self._read()
            rows = s.posts
            if status:
                rows = [p for p in rows if p.status == status]
            return sorted(rows, key=lambda r: r.created_at, reverse=True)

    def save_account(self, platform: str, access_token: str, refresh_token: Optional[str]) -> None:
        with self.lock:
            s = self._read()
            s.accounts[platform] = {"access_token": access_token, "refresh_token": refresh_token}
            self._write(s)

    def get_access_token(self, platform: str) -> Optional[str]:
        with self.lock:
            s = self._read()
            acc = s.accounts.get(platform)
            return acc.get("access_token") if acc else None

    def add_feedback(self, user: Optional[str], message: str, meta: Optional[Dict[str, Any]]) -> FeedbackRecord:
        with self.lock:
            s = self._read()
            rec = FeedbackRecord(id=s.next_feedback_id, user=user, message=message, meta=meta)
            s.next_feedback_id += 1
            s.feedback.append(rec)
            self._write(s)
            return rec

    def list_feedback(self) -> List[FeedbackRecord]:
        with self.lock:
            s = self._read()
            return sorted(s.feedback, key=lambda r: r.created_at, reverse=True)

store = Store(DATA_FILE)

# ---------- Helpers ----------
def _hashtag_suggest(text: str, limit: int = 5) -> List[str]:
    words = re.findall(r"[A-Za-z][A-Za-z0-9']{3,}", text.lower())
    stop = {"this", "that", "with", "from", "your", "about", "into", "have"}
    freq: Dict[str, int] = {}
    for w in words:
        if w in stop:
            continue
        freq[w] = freq.get(w, 0) + 1
    ranked = sorted(freq.items(), key=lambda kv: (-kv[1], kv[0]))
    return [f"#{w}" for w, _ in ranked[:limit]]

def _score(text: str) -> float:
    length = len(text)
    score = 0.5
    if 120 <= length <= 240: score += 0.3
    if re.search(r"\b(let's|try|do|build|learn|start|join|grab)\b", text.lower()): score += 0.15
    if re.search(r"[🚀✨🔥✅🎯💡]", text): score += 0.05
    return round(min(score, 1.0), 2)

def _stub_variants(topic: str, tone: str, count: int) -> List[Dict[str, Any]]:
    out = []
    for i in range(count):
        content = f"{topic.strip()} — {tone} take #{i+1}. Action: reply with your biggest blocker."
        out.append({"content": content, "hashtags": _hashtag_suggest(content), "score": _score(content), "rationale": "length_tune|imperative|emoji_opt", "cost_gbp": 0.0})
    return out

def _approx_tokens(text: str) -> int:
    return max(1, math.ceil(len(text) / 4))

def _estimate_gbp(tokens_in: int, tokens_out: int) -> float:
    return round((tokens_in/1000.0)*LLM_INPUT_COST_PER_1K_GBP + (tokens_out/1000.0)*LLM_OUTPUT_COST_PER_1K_GBP, 4)

def _openai_variants(topic: str, tone: str, count: int, model: str) -> List[Dict[str, Any]]:
    if not OPENAI_API_KEY:
        return _stub_variants(topic, tone, count)
    try:
        from openai import OpenAI
    except Exception:
        return _stub_variants(topic, tone, count)

    client = OpenAI(api_key=OPENAI_API_KEY)
    out: List[Dict[str, Any]] = []
    for _ in range(count):
        user_prompt = (
            f"Write a single concise, helpful social post about '{topic}'. "
            f"Tone: {tone}. Under ~240 chars if possible. Include a clear CTA. Avoid hashtags in the body."
        )
        pre_in = _approx_tokens(user_prompt)
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You write practical, on-brand social posts."},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
        )
        text = (resp.choices[0].message.content or "").strip()
        usage = getattr(resp, "usage", None)
        tokens_in = int(getattr(usage, "prompt_tokens", pre_in) or pre_in) if usage else pre_in
        tokens_out = int(getattr(usage, "completion_tokens", _approx_tokens(text)) or _approx_tokens(text)) if usage else _approx_tokens(text)
        cost = _estimate_gbp(tokens_in, tokens_out)
        out.append({"content": text, "hashtags": _hashtag_suggest(text), "score": _score(text), "rationale": "llm|scored", "cost_gbp": cost})
    return out

def publish_stub(platform: str, content: str, token: Optional[str]) -> Tuple[bool, Optional[str], Optional[str]]:
    if not token: return False, None, "missing_access_token"
    ext_id = f"{platform}_{abs(hash(content)) % 10_000_000}"
    return True, ext_id, None

# Templates library
TEMPLATES: List[Dict[str, Any]] = [
    {"id": "lead_gen_1", "purpose": "lead_gen", "title": "Lead magnet", "template": "Struggling with {pain}? Grab our free {lead_magnet} to {benefit}. {cta}"},
    {"id": "announcement_1", "purpose": "announcement", "title": "New feature", "template": "We've launched {feature}! It helps you {benefit}. Try it today → {cta}"},
    {"id": "educational_1", "purpose": "educational", "title": "Quick how-to", "template": "3 fast steps to {goal}: 1){step1} 2){step2} 3){step3}. Save this. {cta}"},
    {"id": "event_1", "purpose": "event", "title": "Event invite", "template": "Join us on {date_local} for {event}. Learn {benefit}. Seats are limited — {cta}"},
    {"id": "testimonial_1", "purpose": "testimonial", "title": "Customer proof", "template": "\"{quote}\" — {customer}. Result: {result}. Want the same? {cta}"},
    {"id": "promo_1", "purpose": "promotion", "title": "Time-limited offer", "template": "{offer}: {percent}% off until {until_date}. Perfect for {audience}. {cta}"},
    {"id": "bts_1", "purpose": "behind_scenes", "title": "Behind the scenes", "template": "A peek behind the scenes: {process}. Built with ❤️ to {benefit}. {cta}"},
]

def render_template(tpl_id: str, variables: Dict[str, str]) -> str:
    for t in TEMPLATES:
        if t["id"] == tpl_id:
            try:
                return t["template"].format(**variables)
            except KeyError as e:
                var_name = str(e).strip("'")
                raise ValueError(f"Missing variable: {var_name}")
    raise ValueError("Template not found")

def _best_time_from_posts(posts: List[PostRecord]) -> List[Tuple[int,int]]:
    buckets: Dict[Tuple[int,int], int] = {}
    for p in posts:
        if p.status != "published" or not p.scheduled_time: continue
        try:
            dt = datetime.fromisoformat(p.scheduled_time)
        except Exception:
            continue
        dt_local = dt  # stored UTC; label only
        key = (dt_local.weekday(), dt_local.hour)
        buckets[key] = buckets.get(key, 0) + 1
    ranked = sorted(buckets.items(), key=lambda kv: (-kv[1], kv[0][0], kv[0][1]))
    return [k for k,_ in ranked]

def _best_time_defaults() -> List[Tuple[int,int]]:
    return [(1,11),(2,11),(3,11),(4,11),(2,18),(3,18),(4,18)]

def _format_slots(slots: List[Tuple[int,int]], limit: int = 3) -> List[Dict[str, Any]]:
    names = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    return [{"dow": names[d], "hour_24": h, "local_label": f"{names[d]} {h:02d}:00"} for d,h in slots[:limit]]

# ---------- Flask App ----------
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

# Health & auth
@app.route("/healthz")
def healthz():
    return jsonify({"ok": True, "brand": "Smart Flow Systems", "env": APP_ENV, "scheduler": RUN_SCHED, "llm": {"provider": LLM_PROVIDER or "stub", "model": LLM_MODEL}})

@app.route("/auth/manual", methods=["POST"])
def manual_auth():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    platform = data.get("platform")
    access_token = data.get("access_token")
    refresh_token = data.get("refresh_token")
    store.save_account(platform, access_token, refresh_token)
    return jsonify({"ok": True, "platform": platform})

# Compose
@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    topic = data.get("topic", "")
    tone = data.get("tone", "helpful")
    count = data.get("count", 3)
    provider = data.get("provider", "")
    model = data.get("model", LLM_MODEL)
    
    if not topic or len(topic) < 2:
        return jsonify({"detail": "Topic must be at least 2 characters"}), 400
    
    use_openai = provider == "openai"
    drafts = _openai_variants(topic, tone, count, model) if use_openai else _stub_variants(topic, tone, count)
    return jsonify(drafts)

@app.route("/posts", methods=["POST"])
def create_or_schedule():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    platform = data.get("platform")
    content = data.get("content", "").strip()
    scheduled_time = data.get("scheduled_time")
    
    if not content:
        return jsonify({"detail": "Content cannot be empty"}), 400
    
    if scheduled_time:
        try:
            when = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({"detail": "Invalid scheduled_time format"}), 400
    else:
        when = datetime.now(timezone.utc) + timedelta(seconds=10)
    
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    
    if when < datetime.now(timezone.utc):
        return jsonify({"detail": "scheduled_time must be in the future"}), 400

    rec = PostRecord(id=0, platform=platform, content=content, status="scheduled", scheduled_time=when.isoformat())
    saved = store.add_post(rec)
    return jsonify(asdict(saved))

@app.route("/posts", methods=["GET"])
def list_posts():
    status = request.args.get("status")
    rows = store.list_posts(status=status)
    return jsonify([asdict(r) for r in rows])

# Premium scaffolding
@app.route("/templates")
def list_templates():
    purpose = request.args.get("purpose")
    rows = [t for t in TEMPLATES if (purpose is None or t["purpose"] == purpose)]
    return jsonify({"count": len(rows), "templates": rows})

@app.route("/templates/render", methods=["POST"])
def render_tpl():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    template_id = data.get("template_id")
    variables = data.get("variables", {})
    
    try:
        text = render_template(template_id, variables)
        return jsonify({"content": text, "hashtags": _hashtag_suggest(text), "score": _score(text)})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route("/agent/ask", methods=["POST"])
def agent_ask():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    goal = (data.get("goal", "") or "").lower()
    platform = data.get("platform")
    question = data.get("question", "")
    
    mapping = {"leads": ["lead_gen_1","testimonial_1"], "launch": ["announcement_1","promo_1"], "event": ["event_1","lead_gen_1"], "education": ["educational_1","bts_1"]}
    candidates = mapping.get(goal, ["educational_1","lead_gen_1"])
    tips = {"x": "Keep it punchy, ~240 chars. Hook → benefit → CTA.", "linkedin": "Lead with outcome. Line breaks + clear CTA."}
    answer = f"Goal='{goal or 'general'}'. For {platform or 'platforms'}: {tips.get(platform or 'x', tips['x'])}"
    return jsonify({"answer": answer, "suggested_templates": [t for t in TEMPLATES if t["id"] in candidates]})

@app.route("/best-time")
def best_time():
    platform = request.args.get("platform")
    tz = request.args.get("tz", "Europe/London")
    posts = store.list_posts(status="published")
    slots = _best_time_from_posts(posts) or _best_time_defaults()
    return jsonify({"platform": platform, "timezone": tz, "slots": _format_slots(slots)})

@app.route("/feedback", methods=["POST"])
def leave_feedback():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    user = data.get("user")
    message = data.get("message", "").strip()
    meta = data.get("meta")
    
    if not message:
        return jsonify({"error": "Message cannot be empty"}), 400
    
    rec = store.add_feedback(user, message, meta)
    return jsonify({"ok": True, "id": rec.id, "created_at": rec.created_at})

@app.route("/feedback", methods=["GET"])
def list_feedback():
    rows = store.list_feedback()
    return jsonify({"count": len(rows), "items": [asdict(r) for r in rows]})

@app.route("/pricing")
def pricing():
    tiers = [
        {"id":"free","name":"Free","gbp_per_month":0,"limits":{"brands":1,"accounts":2,"scheduled_posts":30},"features":["Basic templates","Default best-time","Feedback"]},
        {"id":"starter","name":"Starter","gbp_per_month":9,"limits":{"brands":3,"accounts":6},"features":["Goal templates + render","Best-time from history","Email export (soon)"]},
        {"id":"pro","name":"Pro","gbp_per_month":29,"limits":{"brands":10,"accounts":15},"features":["OpenAI drafts (quota)","Hashtag intel","A/B copy","Calendar CSV","Agent"]},
        {"id":"business","name":"Business","gbp_per_month":79,"limits":{"brands":"unlimited","accounts":"unlimited"},"features":["Approvals","Advocacy packs","Link in bio","Advanced analytics"]},
    ]
    return jsonify({"currency":"GBP","tiers":tiers})

# Scheduler
def scheduler_loop():
    while True:
        try:
            publish_due()
        except Exception as e:
            print("scheduler error:", e)
        time.sleep(5)

def publish_due():
    now = datetime.now(timezone.utc)
    rows = store.list_posts(status="scheduled")
    for rec in rows:
        if rec.scheduled_time:
            try:
                due = datetime.fromisoformat(rec.scheduled_time)
            except ValueError:
                continue
        else:
            due = now
            
        if due <= now:
            token = store.get_access_token(rec.platform)
            ok, ext_id, err = publish_stub(rec.platform, rec.content, token)
            rec.status = "published" if ok else "failed"
            rec.external_id = ext_id
            rec.error = err
            rec.updated_at = datetime.now(timezone.utc).isoformat()
            store.update_post(rec)

# Static files with absolute paths
@app.route("/static/<path:filename>")
def static_files(filename):
    if STATIC_DIR.exists():
        return send_from_directory(str(STATIC_DIR), filename)
    else:
        return jsonify({"error": "Static files not found"}), 404

@app.route("/")
def index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return send_from_directory(str(STATIC_DIR), "index.html")
    else:
        return jsonify({"error": "Static files not found", "expected_path": str(STATIC_DIR)}), 404

# Start background scheduler if enabled
if RUN_SCHED:
    scheduler_thread = threading.Thread(target=scheduler_loop, daemon=True)
    scheduler_thread.start()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)