from __future__ import annotations

import asyncio
import json
import re
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from pydantic import BaseModel, Field

DATA_FILE = Path("data.json")

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
        self.lock = asyncio.Lock()
        if not file.exists():
            self._write(State())

    def _read(self) -> State:
        raw = json.loads(self.file.read_text() or "{}")
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

    async def add_post(self, rec: PostRecord) -> PostRecord:
        async with self.lock:
            state = self._read()
            rec.id = state.next_post_id
            state.next_post_id += 1
            state.posts.append(rec)
            self._write(state)
            return rec

    async def update_post(self, rec: PostRecord) -> None:
        async with self.lock:
            state = self._read()
            for i, p in enumerate(state.posts):
                if p.id == rec.id:
                    state.posts[i] = rec
                    break
            self._write(state)

    async def list_posts(self, status: Optional[str] = None) -> List[PostRecord]:
        async with self.lock:
            state = self._read()
            rows = state.posts
            if status:
                rows = [p for p in rows if p.status == status]
            return sorted(rows, key=lambda r: r.created_at, reverse=True)

    async def save_account(self, platform: str, access_token: str, refresh_token: Optional[str]) -> None:
        async with self.lock:
            state = self._read()
            state.accounts[platform] = {
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
            self._write(state)

    async def get_access_token(self, platform: str) -> Optional[str]:
        async with self.lock:
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

# ----- API schemas -----
Platform = Literal["x", "linkedin"]

class GenerateRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=500)
    tone: str = Field(default="helpful")
    count: int = Field(default=3, ge=1, le=10)

class DraftOut(BaseModel):
    content: str
    hashtags: List[str]
    score: float
    rationale: str

class CreatePostRequest(BaseModel):
    platform: Platform
    content: str = Field(..., min_length=1, max_length=4000)
    scheduled_time: Optional[datetime] = None  # if None -> now

class PostOut(BaseModel):
    id: int
    platform: Platform
    content: str
    status: str
    scheduled_time: Optional[str]
    external_id: Optional[str]
    error: Optional[str]
    created_at: str
    updated_at: str

class ManualAuthRequest(BaseModel):
    platform: Platform
    access_token: str
    refresh_token: Optional[str] = None

# ----- FastAPI app -----
app = FastAPI(title="Smart Flow Systems — Social AI", version="0.1.0")
_scheduler_task: Optional[asyncio.Task] = None

@app.on_event("startup")
async def _start():
    global _scheduler_task
    _scheduler_task = asyncio.create_task(_scheduler_loop())

@app.on_event("shutdown")
async def _stop():
    if _scheduler_task:
        _scheduler_task.cancel()

@app.get("/healthz")
async def healthz():
    return {"ok": True, "brand": "Smart Flow Systems"}

@app.post("/auth/manual")
async def manual_auth(req: ManualAuthRequest):
    await store.save_account(req.platform, req.access_token, req.refresh_token)
    return {"ok": True, "platform": req.platform}

@app.post("/generate", response_model=List[DraftOut])
async def generate(req: GenerateRequest):
    drafts = generate_variants(req.topic, req.tone, req.count)
    return [DraftOut(**d) for d in drafts]

@app.post("/posts", response_model=PostOut)
async def create_or_schedule(req: CreatePostRequest):
    when = req.scheduled_time or datetime.now(timezone.utc) + timedelta(seconds=10)
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    if when < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="scheduled_time must be in the future")

    rec = PostRecord(
        id=0,
        platform=req.platform,
        content=req.content.strip(),
        status="scheduled",
        scheduled_time=when.isoformat(),
    )
    saved = await store.add_post(rec)
    return PostOut(**asdict(saved))

@app.get("/posts", response_model=List[PostOut])
async def list_posts(status: Optional[str] = Query(default=None)):
    rows = await store.list_posts(status=status)
    return [PostOut(**asdict(r)) for r in rows]

# background publisher
async def _scheduler_loop():
    while True:
        try:
            await _publish_due()
        except Exception as e:
            print("scheduler error:", e)
        await asyncio.sleep(5)

async def _publish_due():
    now = datetime.now(timezone.utc)
    rows = await store.list_posts(status="scheduled")
    for rec in rows:
        due = datetime.fromisoformat(rec.scheduled_time) if rec.scheduled_time else now
        if due <= now:
            token = await store.get_access_token(rec.platform)
            ok, ext_id, err = publish_stub(rec.platform, rec.content, token)
            rec.status = "published" if ok else "failed"
            rec.external_id = ext_id
            rec.error = err
            rec.updated_at = datetime.now(timezone.utc).isoformat()
            await store.update_post(rec)

# static UI
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def index():
    return FileResponse("static/index.html")