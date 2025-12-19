# backend/app/core/config.py

import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

class Config:
    """Base configuration class with common settings."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'a_default_secret_key_for_development')
    
    # Firebase configuration
    FIREBASE_SERVICE_ACCOUNT_KEY_PATH = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY_PATH', 'config/service-account-key.json')
    
    # Basic app settings
    DEBUG = False
    TESTING = False
    ENV = 'production'

class DevelopmentConfig(Config):
    """Configuration for the development environment."""
    DEBUG = True
    ENV = 'development'
    
    # Allow requests from the default React development server
    ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')

class ProductionConfig(Config):
    """Configuration for the production environment."""
    # Production origins should be explicitly set in the .env file
    ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '').split(',')

class TestingConfig(Config):
    """Configuration for the testing environment."""
    TESTING = True
    DEBUG = True
    ENV = 'testing'
    
    # Use a dummy key for tests and allow all origins
    SECRET_KEY = 'test_secret_key_for_testing_only'
    FIREBASE_SERVICE_ACCOUNT_KEY_PATH = 'config/test-service-account-key.json'
    ALLOWED_ORIGINS = "*"

