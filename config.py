import os

class Config:
    # Flask
    FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "fallback-secret")
    DEBUG = os.getenv("DEBUG", "False").lower() in ("true","1","yes")

    # Admin (for lightweight password gate)
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "changeme")

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///smartflow.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Stripe
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

    # Stripe Price IDs
    STRIPE_PRICE_STARTER_MONTHLY     = os.getenv("STRIPE_PRICE_STARTER_MONTHLY")
    STRIPE_PRICE_FLOWKIT_MONTHLY     = os.getenv("STRIPE_PRICE_FLOWKIT_MONTHLY")
    STRIPE_PRICE_LAUNCHPACK_MONTHLY  = os.getenv("STRIPE_PRICE_LAUNCHPACK_MONTHLY")
    STRIPE_PRICE_STARTER_ONEOFF      = os.getenv("STRIPE_PRICE_STARTER_ONEOFF")
    STRIPE_PRICE_FLOWKIT_ONEOFF      = os.getenv("STRIPE_PRICE_FLOWKIT_ONEOFF")
    STRIPE_PRICE_LAUNCHPACK_ONEOFF   = os.getenv("STRIPE_PRICE_LAUNCHPACK_ONEOFF")

    # Email (SMTP)
    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_PORT = int(os.getenv("SMTP_PORT","587"))
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASS = os.getenv("SMTP_PASS")
    SMTP_FROM = os.getenv("SMTP_FROM","no-reply@smartflowsystems.com")

    # SMS: Vonage (Nexmo)
    VONAGE_API_KEY    = os.getenv("VONAGE_API_KEY")
    VONAGE_API_SECRET = os.getenv("VONAGE_API_SECRET")
    VONAGE_NUMBER     = os.getenv("VONAGE_NUMBER")

# Feature gating by plan
FEATURES_BY_PLAN = {
    "starter":   ["booking","basic_ai_bot","one_template"],
    "flowkit":   ["booking","ai_scheduler","sms","portal","two_templates","reports"],
    "launchpack":["booking","ai_scheduler","sms","portal","reports",
                  "ai_concierge","analytics","recovery","automations","three_templates","priority_support"]
}