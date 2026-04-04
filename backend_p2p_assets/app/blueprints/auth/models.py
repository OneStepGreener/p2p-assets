from datetime import datetime
from app.extensions import db


# Association tables for many-to-many relationships
user_roles = db.Table(
    'user_roles',
    db.Column('user_id', db.String(50), db.ForeignKey('users.id'), primary_key=True),
    db.Column('role_id', db.String(50), db.ForeignKey('roles.id'), primary_key=True)
)

role_permissions = db.Table(
    'role_permissions',
    db.Column('role_id', db.String(50), db.ForeignKey('roles.id'), primary_key=True),
    db.Column('permission_id', db.String(50), db.ForeignKey('permissions.id'), primary_key=True)
)


class User(db.Model):
    """User model"""
    __tablename__ = 'users'
    
    id = db.Column(db.String(50), primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    roles = db.relationship('Role', secondary=user_roles, backref=db.backref('users', lazy='dynamic'))
    refresh_tokens = db.relationship('RefreshToken', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'roles': [role.name for role in self.roles]
        }


class Role(db.Model):
    """Role model for RBAC"""
    __tablename__ = 'roles'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    permissions = db.relationship('Permission', secondary=role_permissions, backref=db.backref('roles', lazy='dynamic'))
    
    def __repr__(self):
        return f'<Role {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'permissions': [perm.to_dict() for perm in self.permissions]
        }


class Permission(db.Model):
    """Permission model for fine-grained access control"""
    __tablename__ = 'permissions'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    resource = db.Column(db.String(80), nullable=False)  # e.g., 'assets', 'audits'
    action = db.Column(db.String(80), nullable=False)  # e.g., 'create', 'read', 'update', 'delete'
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<Permission {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'resource': self.resource,
            'action': self.action,
            'description': self.description
        }


class RefreshToken(db.Model):
    """Refresh token model for JWT token management"""
    __tablename__ = 'refresh_tokens'
    
    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False, index=True)
    token = db.Column(db.Text, nullable=False, unique=True, index=True)
    expires_at = db.Column(db.DateTime, nullable=False, index=True)
    is_revoked = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<RefreshToken {self.id}>'
    
    def is_expired(self):
        return datetime.utcnow() > self.expires_at
