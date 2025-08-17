# Import Flask app for gunicorn compatibility
from app import app

# This ensures the app is available for gunicorn as main:app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)