from flask import Blueprint

charts_bp = Blueprint('charts', __name__)

from app.blueprints.charts import routes  # noqa: E402, F401
