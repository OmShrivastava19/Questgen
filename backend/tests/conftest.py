# backend/tests/conftest.py

import pytest
from unittest.mock import MagicMock, patch
import sys

# --- Mock Firebase Admin SDK BEFORE any imports ---
# This must happen before importing any app modules that use Firebase

# Create mock modules
mock_firebase_admin = MagicMock()
mock_firestore = MagicMock()
mock_storage = MagicMock()
mock_auth = MagicMock()
mock_credentials = MagicMock()

# Mock the specific functions and classes
mock_firestore_client = MagicMock()
mock_storage_bucket = MagicMock()

# Set up the mock structure
mock_firebase_admin.initialize_app = MagicMock()
mock_firebase_admin._apps = {}
mock_firebase_admin.get_app = MagicMock()
mock_firestore.client = MagicMock(return_value=mock_firestore_client)
mock_storage.bucket = MagicMock(return_value=mock_storage_bucket)
mock_auth.verify_id_token = MagicMock(return_value={"uid": "test_user_123", "email": "test@example.com"})

# Patch sys.modules before any imports
sys.modules['firebase_admin'] = mock_firebase_admin
sys.modules['firebase_admin.firestore'] = mock_firestore
sys.modules['firebase_admin.storage'] = mock_storage
sys.modules['firebase_admin.auth'] = mock_auth
sys.modules['firebase_admin.credentials'] = mock_credentials

# Now import the app modules
from app.main import create_app
from app.core.config import TestingConfig

@pytest.fixture(scope='function')
def test_app():
    """Creates a test instance of the Flask application for each test."""
    app = create_app(config_class=TestingConfig)
    with app.app_context():
        yield app

@pytest.fixture(scope='function')
def test_client(test_app):
    """Creates a test client for making requests to the API for each test."""
    return test_app.test_client()

@pytest.fixture(autouse=True)
def reset_mocks():
    """Resets all mock objects before each test to ensure isolation."""
    mock_firestore_client.reset_mock()
    mock_storage_bucket.reset_mock()
    mock_auth.verify_id_token.reset_mock()
    mock_firebase_admin.initialize_app.reset_mock()
    mock_firebase_admin.get_app.reset_mock()

# --- Mock Service Fixtures ---
@pytest.fixture
def mock_text_processor(mocker):
    """Mocks the TextProcessor service class."""
    return mocker.patch('app.main.TextProcessor', autospec=True)

@pytest.fixture
def mock_question_generator(mocker):
    """Mocks the QuestionGenerator service class."""
    return mocker.patch('app.main.QuestionGenerator', autospec=True)

@pytest.fixture
def mock_firebase_service(mocker):
    """Mocks the FirebaseService class."""
    return mocker.patch('app.main.FirebaseService', autospec=True)

@pytest.fixture
def mock_export_service(mocker):
    """Mocks the ExportService class."""
    return mocker.patch('app.main.ExportService', autospec=True)
