from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.extensions import db
from app.blueprints.auth.models import User, Role, Permission


def has_permission(resource: str, action: str):
    """Decorator to check if user has specific permission"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            user = db.session.query(User).filter_by(id=user_id).first()
            if not user:
                return jsonify({'message': 'User not found'}), 404
            
            # Check if user has the required permission
            has_perm = False
            for role in user.roles:
                for perm in role.permissions:
                    if perm.resource == resource and perm.action == action:
                        has_perm = True
                        break
                if has_perm:
                    break
            
            if not has_perm:
                return jsonify({'message': 'Insufficient permissions'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def has_role(role_name: str):
    """Decorator to check if user has specific role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            user = db.session.query(User).filter_by(id=user_id).first()
            if not user:
                return jsonify({'message': 'User not found'}), 404
            
            role_names = [role.name for role in user.roles]
            if role_name not in role_names:
                return jsonify({'message': 'Insufficient role permissions'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
