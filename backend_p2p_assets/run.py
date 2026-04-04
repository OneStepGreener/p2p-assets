import os
from app import create_app
from app.config import config

# Get environment from environment variable or default to development
env = os.getenv('FLASK_ENV', 'development')
app = create_app(config[env])

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
