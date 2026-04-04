from flask import Blueprint
from flask_restx import Namespace

discrepancies_bp = Blueprint('discrepancies', __name__)
discrepancies_ns = Namespace('discrepancies', description='Discrepancy management operations')
