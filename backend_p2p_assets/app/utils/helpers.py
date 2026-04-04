from typing import Dict, Any, Tuple


def is_db_connection_error(error: Exception) -> bool:
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


def db_error_message_and_code(error: Exception) -> Tuple[str, int]:
    """Return (message, status_code) for API response when a DB error occurs."""
    if is_db_connection_error(error):
        return (
            'Database unavailable. Check that the Oracle server is running and reachable (host, port, firewall, VPN).',
            503,
        )
    return str(error), 500


def build_response(data: Any = None, message: str = None, status_code: int = 200) -> Dict:
    """Build standardized API response"""
    response = {
        'status_code': status_code,
        'success': status_code < 400
    }
    
    if message:
        response['message'] = message
    
    if data is not None:
        response['data'] = data
    
    return response


def paginate_query(query, page: int = 1, per_page: int = 20):
    """Paginate SQLAlchemy query"""
    return query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
