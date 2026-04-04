# P2P Assets Management Backend

Enterprise-level Flask backend with Blueprint-based MVC architecture for Asset Lifecycle Management System.

## Prerequisites

- Python 3.8 or higher
- Oracle Database (with Oracle Client libraries)
- pip (Python package manager)

## Installation

### 1. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install Oracle Client Libraries

For Oracle Database connectivity, you need Oracle Instant Client:

**Windows:**
- Download Oracle Instant Client from Oracle website
- Extract and add to PATH
- Or install `cx_Oracle` which includes the client

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install libaio1
# Download and install Oracle Instant Client
```

### 4. Configure Environment Variables

Create a `.env` file in the `backend_p2p_assets` directory:

```env
# Flask Configuration
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRES=1800
JWT_REFRESH_TOKEN_EXPIRES=604800

# Oracle Database Configuration
ORACLE_USER=TCICOE
ORACLE_PASSWORD=abc
ORACLE_HOST=124.30.245.82
ORACLE_PORT=1521
ORACLE_SID=orcl

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=INFO

# Rate Limiting
RATELIMIT_ENABLED=true
RATELIMIT_STORAGE_URL=memory://
```

## Running the Application

### Development Mode

```bash
# Make sure you're in the backend_p2p_assets directory
cd backend_p2p_assets

# Activate virtual environment (if not already activated)
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac

# Run the application
python run.py
```

The server will start on `http://localhost:5000`

### Using Flask CLI

```bash
# Set environment
set FLASK_ENV=development  # Windows
export FLASK_ENV=development  # Linux/Mac

# Run
flask run
```

## API Documentation

Once the server is running, access the API documentation at:
- Swagger UI: `http://localhost:5000/api/docs/`

## Project Structure

```
backend_p2p_assets/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── config.py            # Configuration
│   ├── extensions.py        # Flask extensions
│   ├── blueprints/          # Blueprint modules (MVC)
│   │   ├── auth/           # Authentication
│   │   ├── assets/         # Asset management
│   │   ├── audits/         # Audit management
│   │   ├── discrepancies/  # Discrepancy management
│   │   └── allocations/    # Allocation management
│   ├── core/               # Core functionality
│   ├── middleware/         # Custom middleware
│   └── utils/              # Utility functions
├── tests/                  # Test suite
├── scripts/                # Utility scripts
├── requirements.txt        # Dependencies
└── run.py                 # Application entry point
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user (requires JWT)

### Assets (To be implemented)
- `GET /api/v1/assets` - List assets
- `POST /api/v1/assets` - Create asset
- `GET /api/v1/assets/<id>` - Get asset
- `PUT /api/v1/assets/<id>` - Update asset
- `DELETE /api/v1/assets/<id>` - Delete asset

## Troubleshooting

### Oracle Connection Issues

1. **Check Oracle Client Installation:**
   ```bash
   python -c "import cx_Oracle; print(cx_Oracle.clientversion())"
   ```

2. **Verify Database Credentials:**
   - Check `.env` file has correct credentials
   - Test connection using Oracle SQL Developer

3. **Connection String:**
   - For SID: `ORACLE_SID=orcl`
   - For Service Name: `ORACLE_SERVICE_NAME=orcl`

### Import Errors

If you get import errors, make sure:
- Virtual environment is activated
- You're in the correct directory
- All dependencies are installed: `pip install -r requirements.txt`

### Port Already in Use

If port 5000 is already in use:
- Change port in `run.py`: `app.run(debug=True, host='0.0.0.0', port=5001)`
- Or set environment variable: `set FLASK_RUN_PORT=5001`

## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black app/
```

### Linting

```bash
flake8 app/
```

## License

Proprietary - Enterprise Asset Management System
