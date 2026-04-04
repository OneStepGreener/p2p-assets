from flask import jsonify
from app.core.exceptions import BaseAPIException
from app.extensions import db


def _is_db_connection_error(error):
    """True if error is Oracle/DB connection failure (unreachable host, connection refused)."""
    msg = str(error).lower()
    err_type = type(error).__name__
    return (
        'dpy-6005' in msg
        or 'cannot connect to database' in msg
        or 'unreachable host' in msg
        or 'connection refused' in msg
        or 'operationalerror' in err_type.lower()
    )


def register_error_handlers(app):
    """Register global error handlers"""

    @app.errorhandler(BaseAPIException)
    def handle_api_exception(error):
        """Handle custom API exceptions"""
        return jsonify({
            'message': error.message,
            'status_code': error.status_code
        }), error.status_code

    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle 404 errors"""
        return jsonify({
            'message': 'Resource not found',
            'status_code': 404
        }), 404

    @app.errorhandler(500)
    def handle_internal_error(error):
        """Handle 500 errors"""
        try:
            db.session.rollback()
        except Exception:
            pass
        app.logger.error(f'Internal server error: {error}')
        body = {'message': 'Internal server error', 'status_code': 500}
        if _is_db_connection_error(error):
            body['message'] = (
                'Database unavailable. Check that the Oracle server is running and reachable '
                '(host, port, firewall, VPN).'
            )
            return jsonify(body), 503
        return jsonify(body), 500
    
    @app.errorhandler(422)
    def handle_unprocessable_entity(error):
        """Handle 422 errors (validation)"""
        return jsonify({
            'message': 'Unprocessable entity',
            'status_code': 422
        }), 422
