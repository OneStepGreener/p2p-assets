from flask import Blueprint
from flask_restx import Namespace

audits_bp = Blueprint('audits', __name__)
audits_ns = Namespace('audits', description='Audit management operations')
