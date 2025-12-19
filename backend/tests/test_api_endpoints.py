# backend/tests/test_api_endpoints.py

import io
import pytest
from unittest.mock import patch

# Test constants
DECODED_TOKEN = {"uid": "test_user_123", "email": "test@example.com"}
AUTH_HEADER = {"Authorization": "Bearer test_token_123"}

def test_health_check(test_client):
    """Test the /api/health endpoint."""
    response = test_client.get('/api/health')
    
    assert response.status_code == 200
    assert response.json == {"status": "ok"}

def test_swagger_docs(test_client):
    """Test the /apidocs endpoint."""
    response = test_client.get('/apidocs/')
    
    assert response.status_code == 200
    assert "text/html" in response.content_type

@patch('app.utils.auth.auth.verify_id_token', return_value=DECODED_TOKEN)
def test_upload_file_success(mock_verify_token, test_client):
    """Test file upload with invalid file type."""
    # Create a simple text file instead of PDF for more reliable testing
    text_content = b"This is a test document with some content for question generation. It contains multiple sentences and should be processed successfully."
    
    data = {'files': (io.BytesIO(text_content), 'document.txt')}
    response = test_client.post('/api/upload', data=data, headers=AUTH_HEADER, content_type='multipart/form-data')
    
    # The API returns 200 even when files fail, but includes error details in the response
    assert response.status_code == 200
    assert "document.txt" in response.json
    assert response.json["document.txt"]["status"] == "error"
    assert "Invalid file type" in response.json["document.txt"]["message"]

@patch('app.utils.auth.auth.verify_id_token', return_value=DECODED_TOKEN)
def test_upload_file_success_pdf(mock_verify_token, test_client):
    """Test successful file upload and processing."""
    # Create a minimal valid PDF content
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj\n"
        b"<<\n"
        b"/Type /Catalog\n"
        b"/Pages 2 0 R\n"
        b">>\n"
        b"endobj\n"
        b"2 0 obj\n"
        b"<<\n"
        b"/Type /Pages\n"
        b"/Kids [3 0 R]\n"
        b"/Count 1\n"
        b">>\n"
        b"endobj\n"
        b"3 0 obj\n"
        b"<<\n"
        b"/Type /Page\n"
        b"/Parent 2 0 R\n"
        b"/MediaBox [0 0 612 792]\n"
        b"/Contents 4 0 R\n"
        b">>\n"
        b"endobj\n"
        b"4 0 obj\n"
        b"<<\n"
        b"/Length 50\n"
        b">>\n"
        b"stream\n"
        b"BT\n"
        b"/F1 12 Tf\n"
        b"72 720 Td\n"
        b"(Test content for question generation) Tj\n"
        b"ET\n"
        b"endstream\n"
        b"endobj\n"
        b"xref\n"
        b"0 5\n"
        b"0000000000 65535 f \n"
        b"0000000009 00000 n \n"
        b"0000000058 00000 n \n"
        b"0000000115 00000 n \n"
        b"0000000204 00000 n \n"
        b"trailer\n"
        b"<<\n"
        b"/Size 5\n"
        b"/Root 1 0 R\n"
        b">>\n"
        b"startxref\n"
        b"297\n"
        b"%%EOF\n"
    )
    
    data = {'files': (io.BytesIO(pdf_content), 'document.pdf')}
    response = test_client.post('/api/upload', data=data, headers=AUTH_HEADER, content_type='multipart/form-data')
    
    assert response.status_code == 200
    assert "document.pdf" in response.json
    assert response.json["document.pdf"]["status"] == "success"

@patch('app.utils.auth.auth.verify_id_token', return_value=DECODED_TOKEN)
@patch('app.services.firebase_service.FirebaseService.save_question_bank')
def test_generate_questions_success(mock_save_bank, mock_verify_token, test_client):
    """Test successful question generation."""
    # Mock the Firebase service to return a real string ID
    mock_save_bank.return_value = "test_bank_123"
    
    payload = {"context_chunks": ["The sun is hot."], "config": {"num_mcq": 1}}
    response = test_client.post('/api/generate', json=payload, headers=AUTH_HEADER)
    
    assert response.status_code == 200
    assert "questions" in response.json
    assert "answer_key" in response.json
    assert "saved_bank_id" in response.json
    assert response.json["saved_bank_id"] == "test_bank_123"
    assert len(response.json["questions"]) > 0

@patch('app.utils.auth.auth.verify_id_token', return_value=DECODED_TOKEN)
def test_get_questions(mock_verify_token, test_client):
    """Test retrieving all question banks for a user."""
    response = test_client.get('/api/questions', headers=AUTH_HEADER)
    
    assert response.status_code == 200
    assert isinstance(response.json, list)

@patch('app.utils.auth.auth.verify_id_token', return_value=DECODED_TOKEN)
def test_upload_file_no_files(mock_verify_token, test_client):
    """Test file upload with no files."""
    response = test_client.post('/api/upload', headers=AUTH_HEADER, content_type='multipart/form-data')
    
    assert response.status_code == 400
    assert "error" in response.json

@patch('app.utils.auth.auth.verify_id_token', return_value=DECODED_TOKEN)
def test_generate_questions_missing_data(mock_verify_token, test_client):
    """Test question generation with missing data."""
    # Missing context_chunks
    payload = {"config": {"num_mcq": 1}}
    response = test_client.post('/api/generate', json=payload, headers=AUTH_HEADER)
    
    assert response.status_code == 400
    assert "error" in response.json
    
    # Missing config
    payload = {"context_chunks": ["The sun is hot."]}
    response = test_client.post('/api/generate', json=payload, headers=AUTH_HEADER)
    
    assert response.status_code == 400
    assert "error" in response.json

@patch('app.utils.auth.auth.verify_id_token', return_value=DECODED_TOKEN)
def test_export_paper_pdf(mock_verify_token, test_client):
    """Test PDF export functionality."""
    payload = {
        "format": "pdf",
        "title": "Test Paper",
        "questions": [{"question": "Test question?", "type": "mcq"}],
        "answer_key": [{"question": "Test question?", "answer": "Test answer"}]
    }
    
    response = test_client.post('/api/export', json=payload, headers=AUTH_HEADER)
    
    assert response.status_code == 200
    assert response.content_type == "application/pdf"

@patch('app.utils.auth.auth.verify_id_token', return_value=DECODED_TOKEN)
def test_export_paper_docx(mock_verify_token, test_client):
    """Test DOCX export functionality."""
    payload = {
        "format": "docx",
        "title": "Test Paper",
        "questions": [{"question": "Test question?", "type": "mcq"}],
        "answer_key": [{"question": "Test question?", "answer": "Test answer"}]
    }
    
    response = test_client.post('/api/export', json=payload, headers=AUTH_HEADER)
    
    assert response.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.wordprocessingml.document" in response.content_type

@patch('app.utils.auth.auth.verify_id_token', return_value=DECODED_TOKEN)
def test_export_paper_invalid_format(mock_verify_token, test_client):
    """Test export with invalid format."""
    payload = {
        "format": "invalid",
        "title": "Test Paper",
        "questions": [],
        "answer_key": []
    }
    
    response = test_client.post('/api/export', json=payload, headers=AUTH_HEADER)
    
    assert response.status_code == 400
    assert "error" in response.json

def test_upload_file_no_auth(test_client):
    """Test file upload without authentication."""
    response = test_client.post('/api/upload', content_type='multipart/form-data')
    
    assert response.status_code == 401
    assert "error" in response.json

def test_generate_questions_no_auth(test_client):
    """Test question generation without authentication."""
    payload = {"context_chunks": ["The sun is hot."], "config": {"num_mcq": 1}}
    response = test_client.post('/api/generate', json=payload)
    
    assert response.status_code == 401
    assert "error" in response.json
