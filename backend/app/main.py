# backend/app/main.py

import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials
from flasgger import Swagger

# --- Import Blueprints and Configs ---
from app.api.routes import api_blueprint
from app.core.config import DevelopmentConfig, ProductionConfig, TestingConfig
from app.utils.logging_config import setup_logging

# --- Import Service Classes Here ---
from app.services.file_processor import TextProcessor
from app.services.question_generator import QuestionGenerator
from app.services.firebase_service import FirebaseService
from app.services.export_service import ExportService

# Setup structured logging
setup_logging()
logger = logging.getLogger(__name__)

def create_app(config_class=None):
    """
    Creates and configures the Flask application using the factory pattern.
    """
    app = Flask(__name__)

    # --- Configuration ---
    if config_class is None:
        env = os.getenv('FLASK_ENV', 'development')
        if env == 'production':
            config_class = ProductionConfig
            if config_class.SECRET_KEY == 'a_default_secret_key_for_development':
                raise ValueError("A strong SECRET_KEY must be set in the environment for production.")
        elif env == 'testing':
            config_class = TestingConfig
        else:
            config_class = DevelopmentConfig
            
    app.config.from_object(config_class)
    logger.info(f"App running with '{app.config['ENV']}' configuration.")

    # --- Firebase Admin SDK Initialization ---
    try:
        if not firebase_admin._apps:
            service_account_key_path = app.config['FIREBASE_SERVICE_ACCOUNT_KEY_PATH']
            
            # **THIS IS THE CRITICAL FIX**
            # Get the storage bucket name from your .env file
            storage_bucket = os.getenv('FIREBASE_STORAGE_BUCKET')
            if not storage_bucket:
                raise ValueError("FIREBASE_STORAGE_BUCKET environment variable is not set in your .env file.")

            if not os.path.exists(service_account_key_path):
                raise FileNotFoundError(f"Firebase service account key not found at: {service_account_key_path}")
            
            cred = credentials.Certificate(service_account_key_path)
            
            # Pass the storage bucket to the initialization function
            firebase_admin.initialize_app(cred, {
                'storageBucket': storage_bucket
            })
            logger.info("Firebase Admin SDK initialized successfully.")
    except Exception as e:
        logger.critical(f"CRITICAL: Failed to initialize Firebase Admin SDK: {e}", exc_info=True)

    # --- Attach Services to the App ---
    with app.app_context():
        app.text_processor = TextProcessor()
        app.question_generator = QuestionGenerator(model_name="t5-small")
        app.firebase_service = FirebaseService()
        app.export_service = ExportService()

    # --- Extensions & Blueprints ---
    CORS(app, resources={r"/api/*": {"origins": app.config['ALLOWED_ORIGINS']}})
    Limiter(get_remote_address, app=app, default_limits=["200 per day", "50 per hour"])
    Swagger(app)
    app.register_blueprint(api_blueprint, url_prefix='/api')
    logger.info("API blueprint registered.")

    # --- Global Error Handlers ---
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({"error": "Not Found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal Server Error: {error}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=int(os.getenv("PORT", 5000)))
