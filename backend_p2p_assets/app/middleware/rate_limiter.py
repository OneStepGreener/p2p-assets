import time
from functools import wraps
from flask import jsonify, request
from app.config import Config


def rate_limit(max_requests=100, window_seconds=60):
    """Simple rate limiting decorator"""
    # In production, use Redis or similar for distributed rate limiting
    request_counts = {}
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not Config.RATELIMIT_ENABLED:
                return f(*args, **kwargs)
            
            client_id = request.remote_addr
            current_time = int(time.time())
            window_start = current_time - window_seconds
            
            # Clean old entries
            request_counts[client_id] = [
                ts for ts in request_counts.get(client_id, [])
                if ts > window_start
            ]
            
            # Check rate limit
            if len(request_counts[client_id]) >= max_requests:
                return jsonify({
                    'message': 'Rate limit exceeded',
                    'status_code': 429
                }), 429
            
            # Record request
            request_counts[client_id].append(current_time)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
