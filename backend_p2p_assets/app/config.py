import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

    # Set via env: URL_PREFIX for local vs server (e.g. production same path, different host).
    URL_PREFIX = os.getenv('URL_PREFIX', '/aiml/p2p_assets').rstrip('/')
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 1800)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 604800)))
    JWT_ALGORITHM = 'HS256'
    
       # Oracle Database Configuration
    ORACLE_USER = os.getenv('ORACLE_USER', 'TCICOE')
    ORACLE_PASSWORD = os.getenv('ORACLE_PASSWORD', 'abc')
    ORACLE_HOST = os.getenv('ORACLE_HOST', '124.30.245.82')
    ORACLE_PORT = os.getenv('ORACLE_PORT', '1521')
    ORACLE_SERVICE_NAME = os.getenv('ORACLE_SERVICE_NAME')
    ORACLE_SID = os.getenv('ORACLE_SID', 'orcl')
    
    # Build Oracle connection string (using oracledb driver)
    if ORACLE_SERVICE_NAME:
        SQLALCHEMY_DATABASE_URI = f"oracle+oracledb://{ORACLE_USER}:{ORACLE_PASSWORD}@{ORACLE_HOST}:{ORACLE_PORT}/?service_name={ORACLE_SERVICE_NAME}"
    elif ORACLE_SID:
        SQLALCHEMY_DATABASE_URI = f"oracle+oracledb://{ORACLE_USER}:{ORACLE_PASSWORD}@{ORACLE_HOST}:{ORACLE_PORT}/{ORACLE_SID}"
    else:
        SQLALCHEMY_DATABASE_URI = None
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    
    # CORS Configuration: use '*' to allow all origins, or comma-separated list (e.g. http://localhost:5173,http://localhost:5174)
    _cors = os.getenv('CORS_ORIGINS', '*').strip()
    CORS_ORIGINS = '*' if _cors == '*' else [x.strip() for x in _cors.split(',') if x.strip()]
    # When origins='*', credentials must be False per CORS spec
    CORS_SUPPORTS_CREDENTIALS = False if CORS_ORIGINS == '*' else True
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
    CORS_HEADERS = ['Content-Type', 'Authorization', 'X-Requested-With']
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    # Rate Limiting
    RATELIMIT_ENABLED = os.getenv('RATELIMIT_ENABLED', 'true').lower() == 'true'
    RATELIMIT_STORAGE_URL = os.getenv('RATELIMIT_STORAGE_URL', 'memory://')

    # Asset KPIs configuration
    # Active status values for ASSET_STATUS (can be overridden via env)
    ASSET_STATUS_ACTIVE_VALUES = os.getenv(
        'ASSET_STATUS_ACTIVE_VALUES',
        '1,ACTIVE'
    ).split(',')

    # Target utilization percentage
    UTILIZATION_TARGET = float(os.getenv('UTILIZATION_TARGET', '85'))

    # TLOG login API
    TLOG_BASE_URL = os.getenv(
        'TLOG_BASE_URL',
        'http://tlog.grouptci.in/WebServices/UAT_Service/Common.svc'
    )
    TLOG_TIMEOUT = int(os.getenv('TLOG_TIMEOUT', '15'))
    # Comma-separated emp codes that get role ADMIN; others get USER
    ADMIN_EMP_CODES = [x.strip() for x in os.getenv('ADMIN_EMP_CODES', '26284J,18682M,32444').split(',') if x.strip()]


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=300)


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_ECHO = False


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
