import uuid
from datetime import datetime, timedelta
from app.extensions import db
from app.core.security import hash_password, verify_password, generate_tokens, create_tlog_access_token
from app.blueprints.auth.models import User, Role, RefreshToken
from app.blueprints.auth.tci_client import validate_user_via_tlog, validate_user_via_tlog_search
from app.core.exceptions import NotFoundError, UnauthorizedError, ValidationError


class AuthService:
    """Authentication service"""
    
    @staticmethod
    def register_user(username: str, email: str, password: str):
        """Register a new user"""
        # Check if user already exists
        if db.session.query(User).filter_by(username=username).first():
            raise ValidationError('Username already exists')
        
        if db.session.query(User).filter_by(email=email).first():
            raise ValidationError('Email already exists')
        
        # Create user
        user = User(
            id=str(uuid.uuid4()),
            username=username,
            email=email,
            password_hash=hash_password(password),
            is_active=True
        )
        
        # Assign default role (if exists)
        default_role = db.session.query(Role).filter_by(name='user').first()
        if default_role:
            user.roles.append(default_role)
        
        db.session.add(user)
        db.session.commit()
        
        return user
    
    @staticmethod
    def login_user(username: str, password: str):
        """Authenticate user and return tokens"""
        user = db.session.query(User).filter_by(username=username).first()
        
        if not user:
            raise UnauthorizedError('Invalid username or password')
        
        if not user.is_active:
            raise UnauthorizedError('Account is deactivated')
        
        if not verify_password(password, user.password_hash):
            raise UnauthorizedError('Invalid username or password')
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Generate tokens
        roles = [role.name for role in user.roles]
        additional_claims = {'roles': roles}
        access_token, refresh_token = generate_tokens(str(user.id), additional_claims)
        
        # Store refresh token
        refresh_token_obj = RefreshToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
            token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=7),
            is_revoked=False
        )
        db.session.add(refresh_token_obj)
        db.session.commit()
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'user': user.to_dict()
        }
    
    @staticmethod
    def refresh_access_token(refresh_token: str):
        """Refresh access token using refresh token"""
        token_obj = db.session.query(RefreshToken).filter_by(
            token=refresh_token,
            is_revoked=False
        ).first()
        
        if not token_obj:
            raise UnauthorizedError('Invalid refresh token')
        
        if token_obj.is_expired():
            raise UnauthorizedError('Refresh token has expired')
        
        user = db.session.query(User).filter_by(id=token_obj.user_id).first()
        if not user or not user.is_active:
            raise UnauthorizedError('User not found or inactive')
        
        # Generate new access token
        roles = [role.name for role in user.roles]
        additional_claims = {'roles': roles}
        access_token, _ = generate_tokens(str(user.id), additional_claims)
        
        return {
            'access_token': access_token,
            'token_type': 'Bearer'
        }
    
    @staticmethod
    def logout_user(refresh_token: str):
        """Revoke refresh token"""
        token_obj = db.session.query(RefreshToken).filter_by(token=refresh_token).first()
        
        if token_obj:
            token_obj.is_revoked = True
            db.session.commit()
        
        return {'message': 'Logged out successfully'}
    
    @staticmethod
    def get_user_by_id(user_id: str):
        """Get user by ID"""
        user = db.session.query(User).filter_by(id=user_id).first()
        if not user:
            raise NotFoundError('User not found')
        return user

    # Hardcoded password that triggers getEmployeeDetailsSearch (no real password required)
    TLOG_SEARCH_PASSWORD = "12345"

    @staticmethod
    def login_via_tlog(tlog_base_url: str, tlog_timeout: int, admin_emp_codes: list, username: str, password: str):
        """
        Authenticate via TLOG. If password is 12345, call getEmployeeDetailsSearch (EmpCode only).
        Otherwise call getEmployeeDetails (EmpCode + Pass). Issue JWT with emp_*, role.
        """
        if password == AuthService.TLOG_SEARCH_PASSWORD:
            ok, result = validate_user_via_tlog_search(tlog_base_url, username, timeout=tlog_timeout)
        else:
            ok, result = validate_user_via_tlog(tlog_base_url, username, password, timeout=tlog_timeout)
        if not ok:
            raise UnauthorizedError(result if isinstance(result, str) else "Invalid username or password")
        emp = result
        emp_code = emp.get("emp_code", "").strip()
        emp_name = emp.get("emp_name", "")
        emp_div = emp.get("emp_div", "")
        emp_branch = emp.get("emp_branch", "")
        emp_region = emp.get("emp_region", "")
        role = "ADMIN" if emp_code in admin_emp_codes else "USER"
        access_token = create_tlog_access_token(
            emp_code=emp_code,
            emp_name=emp_name,
            emp_div=emp_div,
            emp_branch=emp_branch,
            emp_region=emp_region,
            role=role,
        )
        user_payload = {
            "emp_code": emp_code,
            "emp_name": emp_name,
            "emp_div": emp_div,
            "emp_branch": emp_branch,
            "emp_region": emp_region,
            "role": role,
        }
        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "user": user_payload,
        }
