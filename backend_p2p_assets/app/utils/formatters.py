from datetime import datetime
from decimal import Decimal


def format_date(date_obj, format='%Y-%m-%d'):
    """Format date object to string"""
    if date_obj is None:
        return None
    if isinstance(date_obj, str):
        return date_obj
    return date_obj.strftime(format)


def format_datetime(datetime_obj, format='%Y-%m-%d %H:%M:%S'):
    """Format datetime object to string"""
    if datetime_obj is None:
        return None
    if isinstance(datetime_obj, str):
        return datetime_obj
    return datetime_obj.strftime(format)


def format_decimal(decimal_obj, precision=2):
    """Format decimal to float with precision"""
    if decimal_obj is None:
        return None
    if isinstance(decimal_obj, Decimal):
        return float(round(decimal_obj, precision))
    return float(decimal_obj)
