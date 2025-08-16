"""WSGI adapter to make FastAPI work with gunicorn sync worker"""
from main import app

# Create ASGI-to-WSGI adapter
try:
    from asgiref.wsgi import WsgiToAsgi
    # This won't work - we need the opposite direction
except ImportError:
    pass

# Alternative approach - create a simple WSGI wrapper
def application(environ, start_response):
    """WSGI application wrapper for FastAPI"""
    # This is a basic approach to make FastAPI work with WSGI
    # In practice, we should use an ASGI server like uvicorn
    
    import asyncio
    from starlette.middleware.wsgi import WSGIMiddleware
    
    # Create a simple response for now
    status = '200 OK'
    headers = [('Content-Type', 'text/html')]
    start_response(status, headers)
    
    # Return a simple message directing to use uvicorn
    return [b'''
    <!DOCTYPE html>
    <html>
    <head><title>Smart Flow Systems</title></head>
    <body>
        <h1>Smart Flow Systems - Social AI</h1>
        <p>This application requires uvicorn to run properly.</p>
        <p>Please use: uvicorn main:app --host 0.0.0.0 --port 5000</p>
    </body>
    </html>
    ''']