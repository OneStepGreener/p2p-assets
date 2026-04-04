from flask import Blueprint
from flask_restx import Namespace

auth_bp = Blueprint('auth', __name__)
auth_ns = Namespace('auth', description='Authentication operations')

# Import routes to register them
from app.blueprints.auth import routes
