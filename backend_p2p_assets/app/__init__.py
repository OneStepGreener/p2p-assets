from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.extensions import db, jwt, api
from app.middleware.error_handler import register_error_handlers


def create_app(config_class=Config):
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(config_class)

    prefix = app.config.get('URL_PREFIX', '') or ''
    if prefix and not prefix.startswith('/'):
        prefix = '/' + prefix

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    # Mount API docs under the same prefix (Swagger at prefix/api/docs/)
    api._doc = f'{prefix}/api/docs/' if prefix else '/api/docs/'
    api.init_app(app)
    cors_origins = app.config['CORS_ORIGINS']
    CORS(
        app,
        origins=cors_origins,
        supports_credentials=app.config.get('CORS_SUPPORTS_CREDENTIALS', True),
        methods=app.config.get('CORS_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']),
        allow_headers=app.config.get('CORS_HEADERS', ['Content-Type', 'Authorization', 'X-Requested-With'])
    )

    # Register error handlers
    register_error_handlers(app)

    # Register blueprints under prefix (e.g. /aiml/p2p_assets/api/v1/...)
    from app.blueprints.auth import auth_bp
    from app.blueprints.assets import assets_bp
    from app.blueprints.filters import filters_bp
    from app.blueprints.audits import audits_bp
    from app.blueprints.discrepancies import discrepancies_bp
    from app.blueprints.allocations import allocations_bp
    from app.blueprints.charts import charts_bp

    p = f'{prefix}/api/v1' if prefix else '/api/v1'
    app.register_blueprint(auth_bp, url_prefix=f'{p}/auth')
    app.register_blueprint(assets_bp, url_prefix=f'{p}/assets')
    app.register_blueprint(filters_bp, url_prefix=f'{p}/filters')
    app.register_blueprint(audits_bp, url_prefix=f'{p}/audits')
    app.register_blueprint(discrepancies_bp, url_prefix=f'{p}/discrepancies')
    app.register_blueprint(allocations_bp, url_prefix=f'{p}/allocations')
    app.register_blueprint(charts_bp, url_prefix=f'{p}/charts')

    # Register API namespaces under the same prefix
    from app.blueprints.auth import auth_ns
    from app.blueprints.assets import assets_ns
    from app.blueprints.audits import audits_ns
    from app.blueprints.discrepancies import discrepancies_ns
    from app.blueprints.allocations import allocations_ns

    api.add_namespace(auth_ns, path=f'{p}/auth')
    api.add_namespace(assets_ns, path=f'{p}/assets')
    api.add_namespace(audits_ns, path=f'{p}/audits')
    api.add_namespace(discrepancies_ns, path=f'{p}/discrepancies')
    api.add_namespace(allocations_ns, path=f'{p}/allocations')
    
    # Initialize database
    with app.app_context():
        db.create_all()
    
    return app
