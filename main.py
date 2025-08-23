# Import Flask app for gunicorn compatibility  
from app import app

# Also start Node.js server for enhanced features
import threading
import subprocess
import time

def start_node_server():
    time.sleep(2)  # Let Flask start first
    subprocess.run(['node', 'server.js'])

# Start Node.js server in background thread
node_thread = threading.Thread(target=start_node_server, daemon=True)
node_thread.start()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)