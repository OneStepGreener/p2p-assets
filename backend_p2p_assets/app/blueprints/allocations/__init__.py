from flask import Blueprint
from flask_restx import Namespace

allocations_bp = Blueprint('allocations', __name__)
allocations_ns = Namespace('allocations', description='Asset allocation operations')

# Import routes to register them
from app.blueprints.allocations import routes
