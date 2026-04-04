from flask import Blueprint

filters_bp = Blueprint('filters', __name__)

from app.blueprints.filters import routes  # noqa: E402
