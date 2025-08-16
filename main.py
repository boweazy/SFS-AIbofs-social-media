from __future__ import annotations

import json
import re
import threading
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from flask import Flask, request, jsonify, send_from_directory
import os

# Use absolute path resolution for static files
BASE_DIR: Path = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DATA_FILE = BASE_DIR / "data.json"

@dataclass
class PostRecord:
    id: int
    platform: str
    content: str
    status: Literal["draft", "scheduled", "published", "failed"] = "scheduled"
    scheduled_time: Optional[str] = None  # ISO UTC
    external_id: Optional[str] = None
    error: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

@dataclass
class State:
    next_post_id: int = 1
    posts: List[PostRecord] = field(default_factory=list)
    accounts: Dict[str, Dict[str, Optional[str]]] = field(default_factory=dict)

class Store:
    """Single-file JSON store (keeps setup easy)."""
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
        return State(
            next_post_id=raw.get("next_post_id", 1),
            posts=posts,
            accounts=raw.get("accounts", {}),
        )

    def _write(self, state: State) -> None:
        payload = {
            "next_post_id": state.next_post_id,
            "posts": [asdict(p) for p in state.posts],
            "accounts": state.accounts,
        }
        self.file.write_text(json.dumps(payload, ensure_ascii=False, indent=2))

    def add_post(self, rec: PostRecord) -> PostRecord:
        with self.lock:
            state = self._read()
            rec.id = state.next_post_id
            state.next_post_id += 1
            state.posts.append(rec)
            self._write(state)
            return rec

    def update_post(self, rec: PostRecord) -> None:
        with self.lock:
            state = self._read()
            for i, p in enumerate(state.posts):
                if p.id == rec.id:
                    state.posts[i] = rec
                    break
            self._write(state)

    def list_posts(self, status: Optional[str] = None) -> List[PostRecord]:
        with self.lock:
            state = self._read()
            rows = state.posts
            if status:
                rows = [p for p in rows if p.status == status]
            return sorted(rows, key=lambda r: r.created_at, reverse=True)

    def save_account(self, platform: str, access_token: str, refresh_token: Optional[str]) -> None:
        with self.lock:
            state = self._read()
            state.accounts[platform] = {
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
            self._write(state)

    def get_access_token(self, platform: str) -> Optional[str]:
        with self.lock:
            state = self._read()
            acc = state.accounts.get(platform)
            return acc.get("access_token") if acc else None

store = Store(DATA_FILE)

# ----- simple content helpers (non-LLM) -----
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
    if 120 <= length <= 240:
        score += 0.3
    if re.search(r"\b(let's|try|do|build|learn|start|join|grab)\b", text.lower()):
        score += 0.15
    if re.search(r"[🚀✨🔥✅🎯💡]", text):
        score += 0.05
    return round(min(score, 1.0), 2)

def generate_variants(topic: str, tone: str, count: int) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for i in range(count):
        content = (
            f"{topic.strip()} — {tone} take #{i+1}. "
            f"Action: reply with your biggest blocker."
        )
        out.append({
            "content": content,
            "hashtags": _hashtag_suggest(content),
            "score": _score(content),
            "rationale": "length_tune|imperative|emoji_opt"
        })
    return out

# ----- stub publisher (safe demo) -----
def publish_stub(platform: str, content: str, token: Optional[str]) -> tuple[bool, Optional[str], Optional[str]]:
    if not token:
        return False, None, "missing_access_token"
    ext_id = f"{platform}_{abs(hash(content)) % 10_000_000}"
    return True, ext_id, None

# ----- Flask app -----
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

@app.route("/healthz")
def healthz():
    return jsonify({"ok": True, "brand": "Smart Flow Systems"})

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

@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    topic = data.get("topic", "")
    tone = data.get("tone", "helpful")
    count = data.get("count", 3)
    
    if not topic or len(topic) < 2:
        return jsonify({"detail": "Topic must be at least 2 characters"}), 400
    
    if count < 1 or count > 10:
        count = 3
    
    drafts = generate_variants(topic, tone, count)
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

    rec = PostRecord(
        id=0,
        platform=platform,
        content=content,
        status="scheduled",
        scheduled_time=when.isoformat(),
    )
    saved = store.add_post(rec)
    return jsonify(asdict(saved))

@app.route("/posts", methods=["GET"])
def list_posts():
    status = request.args.get("status")
    rows = store.list_posts(status=status)
    return jsonify([asdict(r) for r in rows])

# Static file serving with absolute paths
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

# Background scheduler
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

# Start background scheduler
scheduler_thread = threading.Thread(target=scheduler_loop, daemon=True)
scheduler_thread.start()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)