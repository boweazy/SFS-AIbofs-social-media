import vonage
from typing import Optional
from config import Config

_client: Optional[vonage.Vonage] = None

def _ensure_client():
    global _client
    if _client is None:
        if not (Config.VONAGE_API_KEY and Config.VONAGE_API_SECRET and Config.VONAGE_NUMBER):
            return False
        _client = vonage.Vonage(api_key=Config.VONAGE_API_KEY, api_secret=Config.VONAGE_API_SECRET)
    return True

def send_sms(to_number: str, message: str) -> bool:
    if not _ensure_client():
        print("[sms] Vonage not configured; skipping.")
        return False
    try:
        resp = _client.sms.send_message({"from": Config.VONAGE_NUMBER, "to": to_number, "text": message})
        if resp and "messages" in resp and len(resp["messages"]) > 0:
            status = resp["messages"][0].get("status")
            if status == "0":
                print("[sms] sent.")
                return True
            print("[sms] failed:", resp["messages"][0].get("error-text"))
        else:
            print("[sms] failed: no response")
        return False
    except Exception as e:
        print("[sms] exception:", e)
        return False