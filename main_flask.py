from __future__ import annotations
import os, random, datetime
from typing import List
from flask import Flask, request, jsonify, render_template, send_from_directory
from pydantic import BaseModel, Field

APP_NAME = "SmartFlow Systems"
THEME = {"bg":"#0b0b0b","gold":"#d4af37","text":"#f2f2f2"}

app = Flask(__name__, static_folder="static", template_folder="templates")

# ------- Models for API -------
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

# ------- Helpers for rule-based copy -------
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

# ------- Routes -------
@app.get("/")
def home():
    return render_template("index.html", app_name=APP_NAME, theme=THEME)

@app.get("/pricing")
def pricing():
    plans = [
      {"name":"Starter","price":"£19/mo","bullets":["30 posts/mo","1 platform","Templates + Schedule"]},
      {"name":"Pro","price":"£49/mo","bullets":["90 posts/mo","2 platforms","Smart Replies, Best-Time, Export"]},
      {"name":"Premium","price":"£99/mo","bullets":["Unlimited drafts","Bulk Schedule + Experiments","Team seats (2)"]}
    ]
    return render_template("pricing.html", plans=plans, app_name=APP_NAME, theme=THEME)

@app.get("/portfolio")
def portfolio():
    samples = [
      {"title":"AI Social Bot","desc":"Generate + schedule with analytics","link":"#"},
      {"title":"Booking System","desc":"Stripe + Calendar + SMS reminders","link":"#"},
      {"title":"E-commerce Setup","desc":"Theme, payments, fulfilment","link":"#"},
      {"title":"Chat Agents","desc":"Lead capture & support automation","link":"#"}
    ]
    return render_template("portfolio.html", samples=samples, app_name=APP_NAME, theme=THEME)

@app.get("/health")
def health():
    return {"status":"ok","ts":datetime.datetime.utcnow().isoformat()}

@app.get("/_setup")
def setup_page():
    env = {
      "STRIPE_KEY": bool(os.getenv("STRIPE_KEY")),
      "OPENAI_API_KEY": bool(os.getenv("OPENAI_API_KEY")),
      "SMTP_USER": bool(os.getenv("SMTP_USER")),
    }
    missing = [k for k,v in env.items() if not v]
    steps = [
      "Optional: add STRIPE_KEY, OPENAI_API_KEY, SMTP_USER in the Replit Secrets for full stack features.",
      "Run the demo now without keys. API is rule-based.",
      "Click Pricing to preview plans. Use Portfolio to showcase builds.",
    ]
    return render_template("setup.html", env=env, missing=missing, steps=steps, app_name=APP_NAME, theme=THEME)

@app.post("/api/generate_posts")
def generate_posts():
    try:
      data = request.get_json(force=True) or {}
      req = GenerateRequest(**data)
    except Exception as e:
      return jsonify({"error": str(e)}), 400

    posts = [make_post(req.topic, req.tone, req.platform, req.niche).model_dump() for _ in range(req.count)]
    return jsonify({"platform": req.platform, "count": req.count, "posts": posts})

# NEW: simple browser tester page
@app.get("/tester")
def tester():
    return render_template("tester.html", app_name=APP_NAME, theme=THEME)

# Static
@app.get("/static/<path:filename>")
def static_files(filename):
    return send_from_directory("static", filename)

if __name__ == "__main__":
    port = int(os.getenv("PORT", "3000"))
    print("Quick links: /health  /_setup  /pricing  /portfolio  /tester")
    app.run(host="0.0.0.0", port=port)