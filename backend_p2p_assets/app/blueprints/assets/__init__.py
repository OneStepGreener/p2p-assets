from flask import Blueprint
from flask_restx import Namespace

assets_bp = Blueprint('assets', __name__)
assets_ns = Namespace('assets', description='Asset management operations')

# Import routes to register them
from app.blueprints.assets import routes
