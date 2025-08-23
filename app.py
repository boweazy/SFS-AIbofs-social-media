import os
from flask import Flask, render_template

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/pricing')
def pricing():
    return render_template('pricing.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)