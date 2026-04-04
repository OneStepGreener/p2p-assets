import re
from datetime import datetime


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_date(date_string: str, format='%Y-%m-%d') -> bool:
    """Validate date format"""
    try:
        datetime.strptime(date_string, format)
        return True
    except ValueError:
        return False


def validate_asset_status(status: str) -> bool:
    """Validate asset status"""
    valid_statuses = ['Active', 'Idle', 'Under Maintenance', 'Disposed']
    return status in valid_statuses
