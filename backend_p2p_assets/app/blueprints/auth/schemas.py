from marshmallow import Schema, fields, validate, ValidationError, validates_schema


class UserSchema(Schema):
    """User schema for serialization"""
    id = fields.Str(dump_only=True)
    username = fields.Str(required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8), load_only=True)
    is_active = fields.Bool(missing=True)
    roles = fields.List(fields.Str(), dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    last_login = fields.DateTime(dump_only=True)


class LoginSchema(Schema):
    """Login request schema"""
    username = fields.Str(required=True)
    password = fields.Str(required=True)


class RegisterSchema(Schema):
    """Registration request schema"""
    username = fields.Str(required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))
    confirm_password = fields.Str(required=True, validate=validate.Length(min=8))
    
    @validates_schema
    def validate_passwords(self, data, **kwargs):
        if data.get('password') != data.get('confirm_password'):
            raise ValidationError('Passwords do not match', 'confirm_password')


class TokenSchema(Schema):
    """Token response schema"""
    access_token = fields.Str()
    refresh_token = fields.Str()
    token_type = fields.Str(default='Bearer')


class RoleSchema(Schema):
    """Role schema"""
    id = fields.Str(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()
    permissions = fields.List(fields.Nested('PermissionSchema'), dump_only=True)


class PermissionSchema(Schema):
    """Permission schema"""
    id = fields.Str(dump_only=True)
    name = fields.Str(required=True)
    resource = fields.Str(required=True)
    action = fields.Str(required=True)
    description = fields.Str()
