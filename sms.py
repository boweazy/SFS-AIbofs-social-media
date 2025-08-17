from typing import Optional
from config import Config

def send_sms(to_number: str, message: str) -> bool:
    """Send SMS using Vonage (stub implementation for demo)"""
    if not (Config.VONAGE_API_KEY and Config.VONAGE_API_SECRET and Config.VONAGE_NUMBER):
        print("[sms] Vonage not configured; skipping.")
        return False
    
    try:
        # Stub implementation - in production you would use vonage library
        print(f"[sms] Would send to {to_number}: {message}")
        print("[sms] SMS sent (demo mode)")
        return True
    except Exception as e:
        print(f"[sms] exception: {e}")
        return False