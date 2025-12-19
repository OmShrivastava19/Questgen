# backend/app/utils/auth.py

from functools import wraps
from flask import request, jsonify
import firebase_admin
from firebase_admin import auth
import logging

logger = logging.getLogger(__name__)

def token_required(f):
    """
    Decorator to ensure a valid Firebase Authentication ID token is provided.
    The decoded token containing user info is passed to the decorated function.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        # Check for token in 'Authorization' header
        if 'Authorization' in request.headers:
            # Expected format: "Bearer <token>"
            try:
                token = request.headers['Authorization'].split(" ")[1]
            except IndexError:
                return jsonify({"error": "Invalid Authorization header format. Expected 'Bearer <token>'"}), 401

        if not token:
            return jsonify({"error": "Authentication Token is missing!"}), 401

        try:
            # Verify the token against the Firebase Auth API.
            # This is a network call, so it adds latency but is highly secure.
            decoded_token = auth.verify_id_token(token)
            current_user = decoded_token
        except auth.ExpiredIdTokenError:
            logger.warning("User provided an expired ID token.")
            return jsonify({"error": "Token has expired. Please log in again."}), 401
        except auth.InvalidIdTokenError as e:
            logger.error(f"Invalid ID token provided: {e}")
            return jsonify({"error": "Invalid Authentication Token."}), 401
        except Exception as e:
            logger.error(f"An unexpected error occurred during token verification: {e}", exc_info=True)
            return jsonify({"error": "Could not verify authentication token."}), 500
        
        # Pass the decoded user info to the route function
        return f(current_user, *args, **kwargs)

    return decorated_function
