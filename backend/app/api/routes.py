# backend/app/api/routes.py

import logging
from flask import Blueprint, request, jsonify, current_app, send_file
from werkzeug.utils import secure_filename
import io

# Import only utilities, not service classes
from app.utils.auth import token_required

# --- Blueprint Configuration ---
api_blueprint = Blueprint('api', __name__)
logger = logging.getLogger(__name__)

# --- REMOVED global service initializations and imports ---
# Services will now be accessed exclusively via the `current_app` proxy.

@api_blueprint.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok"}), 200

@api_blueprint.route('/upload', methods=['POST'])
@token_required
def upload_files(current_user):
    """Upload and process files."""
    if 'files' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    files = request.files.getlist('files')
    if not files or files[0].filename == '':
        return jsonify({"error": "No files selected"}), 400

    files_to_process = []
    for file in files:
        filename = secure_filename(file.filename)
        files_to_process.append((file.stream, filename))

    try:
        # Access service from current_app
        processed_data = current_app.text_processor.process_files(files_to_process)
        return jsonify(processed_data), 200
    except Exception as e:
        logger.error(f"Error during file processing: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred during file processing."}), 500

@api_blueprint.route('/generate', methods=['POST'])
@token_required
def generate_questions_route(current_user):
    """Generate questions from text."""
    data = request.get_json()
    if not data or 'context_chunks' not in data or 'config' not in data:
        return jsonify({"error": "Missing 'context_chunks' or 'config' in request body"}), 400

    try:
        # Access services from current_app
        question_generator = current_app.question_generator
        firebase_service = current_app.firebase_service

        results = question_generator.generate_questions(data['context_chunks'], data['config'])
        
        # Try to persist to Firestore, but do not fail the whole request if Firebase is unavailable
        try:
            metadata = {"title": data.get("title", "Untitled Question Set"), "source": "text_input"}
            bank_id = firebase_service.save_question_bank(current_user['uid'], results['questions'], metadata)
            results['saved_bank_id'] = bank_id
        except Exception as fe:
            logger.warning(f"Skipping Firestore save (non-fatal): {fe}")
            results['saved_bank_id'] = None
        
        return jsonify(results), 200
    except Exception as e:
        logger.error(f"Error during question generation: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred during question generation."}), 500

@api_blueprint.route('/questions', methods=['GET'])
@token_required
def get_question_banks(current_user):
    """Retrieve all question banks for the authenticated user."""
    try:
        banks = current_app.firebase_service.get_question_banks(current_user['uid'])
        return jsonify(banks), 200
    except ConnectionError as ce:
        logger.warning(f"Firestore not connected, returning empty list: {ce}")
        return jsonify([]), 200
    except Exception as e:
        logger.error(f"Failed to retrieve question banks for user {current_user['uid']}: {e}", exc_info=True)
        return jsonify({"error": "Could not retrieve question banks."}), 500

@api_blueprint.route('/questions/<string:bank_id>', methods=['DELETE'])
@token_required
def delete_question_bank_route(current_user, bank_id):
    """Delete a specific question bank."""
    try:
        current_app.firebase_service.delete_question_bank(current_user['uid'], bank_id)
        return jsonify({"message": "Question bank deleted successfully"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        logger.error(f"Failed to delete bank {bank_id}: {e}", exc_info=True)
        return jsonify({"error": "Could not delete question bank."}), 500

@api_blueprint.route('/export', methods=['POST'])
@token_required
def export_paper(current_user):
    """Export questions to PDF or Word."""
    data = request.get_json()
    export_format = data.get('format', 'pdf')
    title = data.get('title', 'Generated Question Paper')
    questions = data.get('questions', [])
    answer_key = data.get('answer_key', [])

    try:
        export_service = current_app.export_service
        if export_format == 'pdf':
            buffer = export_service.export_to_pdf(title, questions, answer_key)
            filename = "question_paper.pdf"
            mimetype = "application/pdf"
        elif export_format == 'docx':
            buffer = export_service.export_to_docx(title, questions, answer_key)
            filename = "question_paper.docx"
            mimetype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        else:
            return jsonify({"error": "Unsupported format"}), 400
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=filename,
            mimetype=mimetype
        )
    except Exception as e:
        logger.error(f"Error during file export: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred during file export."}), 500
