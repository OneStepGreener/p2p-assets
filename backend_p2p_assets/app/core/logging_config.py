import logging
import sys
from logging.handlers import RotatingFileHandler
from app.config import Config


def setup_logging(app):
    """Setup application logging"""
    log_level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO').upper())
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    
    # File handler
    file_handler = RotatingFileHandler(
        'logs/app.log',
        maxBytes=10240000,
        backupCount=10
    )
    file_handler.setLevel(log_level)
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(pathname)s:%(lineno)d - %(message)s'
    )
    file_handler.setFormatter(file_formatter)
    
    # Root logger
    app.logger.setLevel(log_level)
    app.logger.addHandler(console_handler)
    app.logger.addHandler(file_handler)
    
    # Suppress noisy loggers
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
