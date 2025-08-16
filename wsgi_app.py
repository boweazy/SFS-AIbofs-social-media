from main import app
import asyncio
from asgiref.wsgi import WsgiToAsgi

# Convert FastAPI (ASGI) to WSGI for gunicorn compatibility
wsgi_app = WsgiToAsgi(app)

# For gunicorn
application = wsgi_app