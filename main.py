# Import Flask app for gunicorn compatibility  
from app import app

# Start SocialScale TypeScript server for enhanced features
import threading
import subprocess
import time
import os

def start_socialscale_server():
    """Start the SocialScale TypeScript server on port 8787"""
    time.sleep(2)  # Let Flask start first
    try:
        # Use absolute path to avoid directory issues
        subprocess.run(['tsx', 'sfs-socialscale/server/src/index.ts'], cwd='.')
    except Exception as e:
        print(f"SocialScale server error: {e}")
        # Fallback to original Node.js server
        subprocess.run(['node', 'server.js'])

def start_react_client():
    """Start the React development server on port 5173"""
    time.sleep(5)  # Let servers start first
    try:
        subprocess.run(['npm', 'run', 'dev'], cwd='sfs-socialscale/client')
    except Exception as e:
        print(f"React client error: {e}")

# Start SocialScale server in background thread
socialscale_thread = threading.Thread(target=start_socialscale_server, daemon=True)
socialscale_thread.start()

# Start React client in background thread
react_thread = threading.Thread(target=start_react_client, daemon=True)
react_thread.start()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)