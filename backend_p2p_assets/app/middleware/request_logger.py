from flask import request, g
import time


def register_request_logger(app):
    """Register request logging middleware"""
    
    @app.before_request
    def before_request():
        g.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            app.logger.info(
                f'{request.method} {request.path} - '
                f'Status: {response.status_code} - '
                f'Duration: {duration:.3f}s'
            )
        return response
