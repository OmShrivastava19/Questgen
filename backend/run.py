# backend/run.py

import os
from dotenv import load_dotenv

# Load environment variables from .env file before anything else
load_dotenv()

from app.main import create_app

# Get the environment from the FLASK_ENV variable, default to 'development'
# This ensures the correct configuration is loaded by the factory.
env = os.getenv('FLASK_ENV', 'development')

# Create the Flask app instance using the application factory
app = create_app()

if __name__ == '__main__':
    # This block allows running the app directly with `python run.py`
    # though `flask run` is the recommended method for development.
    app.run()
