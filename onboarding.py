import smtplib
from email.mime.text import MIMEText
from config import Config

def send_email_smtp(to_email: str, subject: str, body: str):
    if not (Config.SMTP_HOST and Config.SMTP_USER and Config.SMTP_PASS):
        print("[email] SMTP not configured; skipping.")
        return
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = Config.SMTP_FROM
    msg["To"] = to_email
    with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
        server.starttls()
        server.login(Config.SMTP_USER, Config.SMTP_PASS)
        server.sendmail(Config.SMTP_FROM, [to_email], msg.as_string())

def onboarding_email(plan: str):
    return f"""Welcome to SmartFlow Systems 👋

You're on the '{plan.title()}' plan.

Next steps:
1) Connect Google Calendar
2) Add brand colours (black+gold)
3) Enable reminders in Settings → Notifications
— Team SmartFlow
"""