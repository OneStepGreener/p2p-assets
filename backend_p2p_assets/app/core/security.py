import bcrypt
from datetime import datetime, timedelta
from flask_jwt_extended import create_access_token, create_refresh_token


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


def generate_tokens(user_id: str, additional_claims: dict = None):
    """Generate access and refresh tokens"""
    access_token = create_access_token(
        identity=user_id,
        additional_claims=additional_claims or {}
    )
    refresh_token = create_refresh_token(identity=user_id)
    return access_token, refresh_token


def create_tlog_access_token(emp_code: str, emp_name: str, emp_div: str, emp_branch: str, emp_region: str, role: str):
    """Create JWT for TLOG login with required claims."""
    return create_access_token(
        identity=emp_code,
        additional_claims={
            "emp_code": emp_code,
            "emp_name": emp_name,
            "emp_div": emp_div,
            "emp_branch": emp_branch,
            "emp_region": emp_region,
            "role": role,
        },
    )
