"""
Get current user scope from JWT (TLOG claims).
Used by assets and filters to enforce role-based data access.
"""
from flask_jwt_extended import get_jwt


def get_current_scope():
    """
    Return scope dict from JWT: emp_code, emp_name, emp_div, emp_branch, emp_region, role.
    If not TLOG JWT (no role claim), returns None (caller may treat as no restriction or reject).
    """
    try:
        jwt_data = get_jwt()
        if not jwt_data:
            return None
        role = jwt_data.get("role")
        if role is None:
            return None
        return {
            "emp_code": jwt_data.get("emp_code") or "",
            "emp_name": jwt_data.get("emp_name") or "",
            "emp_div": jwt_data.get("emp_div") or "",
            "emp_branch": jwt_data.get("emp_branch") or "",
            "emp_region": jwt_data.get("emp_region") or "",
            "role": role,
        }
    except Exception:
        return None
