from flask import request, current_app
from flask_restx import Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.blueprints.auth import auth_bp, auth_ns
from app.blueprints.auth.services import AuthService
from app.blueprints.auth.schemas import LoginSchema, RegisterSchema, TokenSchema, UserSchema
from app.blueprints.auth.validators import validate_user_data
from app.core.exceptions import ValidationError, UnauthorizedError
from app.utils.helpers import build_response
from marshmallow import ValidationError as MarshmallowValidationError


@auth_ns.route('/register')
@auth_ns.doc('register')
class Register(Resource):
    @auth_ns.expect(auth_ns.model('Register', {
        'username': fields.String(required=True),
        'email': fields.String(required=True),
        'password': fields.String(required=True),
        'confirm_password': fields.String(required=True)
    }))
    @auth_ns.marshal_with(auth_ns.model('User', {
        'id': fields.String(),
        'username': fields.String(),
        'email': fields.String()
    }))
    def post(self):
        """Register a new user"""
        try:
            schema = RegisterSchema()
            data = schema.load(request.json)
            
            # Validate user data
            validate_user_data(data)
            
            # Register user
            user = AuthService.register_user(
                username=data['username'],
                email=data['email'],
                password=data['password']
            )
            
            return build_response(
                data=UserSchema().dump(user),
                message='User registered successfully',
                status_code=201
            ), 201
            
        except MarshmallowValidationError as e:
            return build_response(
                message='Validation error',
                status_code=400
            ), 400
        except ValidationError as e:
            return build_response(
                message=str(e),
                status_code=400
            ), 400
        except Exception as e:
            return build_response(
                message='Registration failed',
                status_code=500
            ), 500


@auth_ns.route('/login')
@auth_ns.doc('login')
class Login(Resource):
    @auth_ns.expect(auth_ns.model('Login', {
        'username': fields.String(required=True),
        'password': fields.String(required=True)
    }))
    def post(self):
        """Login via TLOG getEmployeeDetails. Returns JWT with emp_code, emp_name, emp_div, emp_branch, emp_region, role."""
        try:
            schema = LoginSchema()
            data = schema.load(request.json)
            tlog_base = current_app.config.get('TLOG_BASE_URL')
            tlog_timeout = current_app.config.get('TLOG_TIMEOUT', 15)
            admin_codes = current_app.config.get('ADMIN_EMP_CODES', [])
            result = AuthService.login_via_tlog(
                tlog_base, tlog_timeout, admin_codes,
                data['username'],
                data['password']
            )
            return build_response(
                data=result,
                message='Login successful',
                status_code=200
            ), 200
        except MarshmallowValidationError as e:
            return build_response(
                message='Validation error',
                status_code=400
            ), 400
        except UnauthorizedError as e:
            return build_response(
                message=str(e),
                status_code=401
            ), 401
        except Exception as e:
            return build_response(
                message='Login failed',
                status_code=500
            ), 500


@auth_ns.route('/refresh')
@auth_ns.doc('refresh')
class Refresh(Resource):
    @auth_ns.expect(auth_ns.model('Refresh', {
        'refresh_token': fields.String(required=True)
    }))
    def post(self):
        """Refresh access token"""
        try:
            refresh_token = request.json.get('refresh_token')
            if not refresh_token:
                return build_response(
                    message='Refresh token required',
                    status_code=400
                ), 400
            
            result = AuthService.refresh_access_token(refresh_token)
            
            return build_response(
                data=result,
                message='Token refreshed successfully',
                status_code=200
            ), 200
            
        except UnauthorizedError as e:
            return build_response(
                message=str(e),
                status_code=401
            ), 401
        except Exception as e:
            return build_response(
                message='Token refresh failed',
                status_code=500
            ), 500


@auth_ns.route('/logout')
@auth_ns.doc('logout')
class Logout(Resource):
    decorators = [jwt_required()]
    def post(self):
        """Logout user"""
        try:
            refresh_token = request.json.get('refresh_token')
            if not refresh_token:
                return build_response(
                    message='Refresh token required',
                    status_code=400
                ), 400
            
            result = AuthService.logout_user(refresh_token)
            
            return build_response(
                data=result,
                message='Logged out successfully',
                status_code=200
            ), 200
            
        except Exception as e:
            return build_response(
                message='Logout failed',
                status_code=500
            ), 500


@auth_ns.route('/me')
@auth_ns.doc('get_current_user')
class GetCurrentUser(Resource):
    decorators = [jwt_required()]
    def get(self):
        """Get current user from JWT (TLOG: emp_code, emp_name, emp_div, emp_branch, emp_region, role)."""
        try:
            jwt_data = get_jwt()
            if jwt_data.get('role') is not None:
                user_payload = {
                    'emp_code': jwt_data.get('emp_code') or get_jwt_identity(),
                    'emp_name': jwt_data.get('emp_name') or '',
                    'emp_div': jwt_data.get('emp_div') or '',
                    'emp_branch': jwt_data.get('emp_branch') or '',
                    'emp_region': jwt_data.get('emp_region') or '',
                    'role': jwt_data.get('role') or 'USER',
                }
                return build_response(data=user_payload, message='User retrieved successfully', status_code=200), 200
            user_id = get_jwt_identity()
            user = AuthService.get_user_by_id(user_id)
            return build_response(
                data=UserSchema().dump(user),
                message='User retrieved successfully',
                status_code=200
            ), 200
        except Exception as e:
            return build_response(
                message='Failed to retrieve user',
                status_code=500
            ), 500
