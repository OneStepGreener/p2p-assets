from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_restx import Api

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
api = Api(
    version='1.0',
    title='P2P Assets Management API',
    description='Enterprise Asset Lifecycle Management System API',
    doc='/api/docs/'
)
