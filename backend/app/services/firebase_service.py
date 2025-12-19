# backend/app/services/firebase_service.py

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple, IO

from firebase_admin import auth, firestore, storage
from google.cloud.firestore_v1.base_query import FieldFilter

# --- Setup Logging ---
logger = logging.getLogger(__name__)

class FirebaseService:
    """
    A comprehensive service class to handle all backend interactions with
    Firebase services, including Authentication, Firestore, and Cloud Storage.

    **Required Firestore Security Rules:**

    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Users can only access their own data
        match /users/{userId}/{document=**} {
          allow read, write, delete: if request.auth != null && request.auth.uid == userId;
        }
        // User analytics can be created by the user, but not read or updated
        match /analytics/{userId}/events/{eventId} {
            allow create: if request.auth != null && request.auth.uid == userId;
            allow read, update, delete: if false; // Only backend can read
        }
      }
    }
    ```

    **Required Firebase Storage Security Rules:**

    ```
    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        // Users can only upload to their own folder and read their own files.
        match /uploads/{userId}/{allPaths=**} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```
    """

    def __init__(self):
        """Initializes the Firestore client and Storage bucket."""
        try:
            self.db = firestore.client()
            self.bucket = storage.bucket() # Default bucket from initialization
            logger.info("Firestore client and Storage bucket initialized successfully.")
        except Exception as e:
            logger.critical(f"CRITICAL: Failed to initialize Firebase services: {e}", exc_info=True)
            self.db = None
            self.bucket = None

    # --- Authentication ---
    def authenticate_user(self, token: str) -> Dict[str, Any]:
        """
        Verifies a Firebase ID token.

        Args:
            token (str): The Firebase ID token from the client.

        Returns:
            Dict[str, Any]: The decoded token payload containing user info.

        Raises:
            ValueError: If the token is invalid or expired.
        """
        if not token:
            raise ValueError("Authentication token is missing.")
        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except auth.ExpiredIdTokenError:
            logger.warning("User provided an expired ID token.")
            raise ValueError("Token has expired. Please log in again.")
        except auth.InvalidIdTokenError as e:
            logger.error(f"Invalid ID token provided: {e}")
            raise ValueError("Invalid Authentication Token.")
        except Exception as e:
            logger.error(f"Unexpected error during token verification: {e}", exc_info=True)
            raise ConnectionError("Could not verify authentication token.")

    # --- Question Bank Management (Firestore) ---
    def save_question_bank(self, user_id: str, questions: List[Dict], metadata: Dict) -> str:
        """
        Saves a new question bank document for a user.

        Args:
            user_id (str): The user's UID.
            questions (List[Dict]): The list of question objects.
            metadata (Dict): Metadata like title, source filename, etc.

        Returns:
            str: The ID of the newly created question bank document.
        """
        if not self.db:
            raise ConnectionError("Firestore is not connected.")
        
        bank_ref = self.db.collection('users').document(user_id).collection('questionBanks').document()
        
        bank_data = {
            "metadata": metadata,
            "questions": questions,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        bank_ref.set(bank_data)
        logger.info(f"Saved new question bank {bank_ref.id} for user {user_id}.")
        self.track_event(user_id, "question_bank_created", {"bank_id": bank_ref.id, "num_questions": len(questions)})
        return bank_ref.id

    def get_question_banks(self, user_id: str, filters: Optional[Dict] = None) -> List[Dict]:
        """
        Retrieves all question banks for a user, with optional filtering.

        Args:
            user_id (str): The user's UID.
            filters (Optional[Dict]): A dictionary for filtering (e.g., {"metadata.subject": "History"}).

        Returns:
            List[Dict]: A list of question bank documents.
        """
        if not self.db:
            raise ConnectionError("Firestore is not connected.")
        
        query = self.db.collection('users').document(user_id).collection('questionBanks')
        
        if filters:
            for key, value in filters.items():
                query = query.where(filter=FieldFilter(key, "==", value))

        docs = query.order_by("created_at", direction="DESCENDING").stream()
        
        banks = []
        for doc in docs:
            bank_data = doc.to_dict()
            bank_data['id'] = doc.id
            banks.append(bank_data)
        
        logger.info(f"Retrieved {len(banks)} question banks for user {user_id}.")
        return banks

    def update_question(self, user_id: str, bank_id: str, question_index: int, data: Dict) -> None:
        """
        Updates a single question within a question bank document.
        Note: This replaces the entire question object at the specified index.

        Args:
            user_id (str): The user's UID.
            bank_id (str): The ID of the question bank.
            question_index (int): The index of the question in the 'questions' array.
            data (Dict): The new question data.
        """
        if not self.db:
            raise ConnectionError("Firestore is not connected.")
            
        bank_ref = self.db.collection('users').document(user_id).collection('questionBanks').document(bank_id)
        
        # Firestore doesn't support updating a single array element directly by index.
        # We must read the document, modify the array in memory, and write it back.
        doc = bank_ref.get()
        if not doc.exists:
            raise ValueError("Question bank not found.")
        
        bank_data = doc.to_dict()
        questions = bank_data.get("questions", [])
        
        if 0 <= question_index < len(questions):
            questions[question_index] = data
            bank_ref.update({"questions": questions, "updated_at": datetime.utcnow()})
            logger.info(f"Updated question at index {question_index} in bank {bank_id} for user {user_id}.")
        else:
            raise IndexError("Question index is out of bounds.")

    def delete_question_bank(self, user_id: str, bank_id: str) -> None:
        """Deletes an entire question bank document."""
        if not self.db:
            raise ConnectionError("Firestore is not connected.")
        
        bank_ref = self.db.collection('users').document(user_id).collection('questionBanks').document(bank_id)
        if not bank_ref.get().exists:
            raise ValueError("Question bank not found.")
        
        bank_ref.delete()
        logger.info(f"Deleted question bank {bank_id} for user {user_id}.")

    # --- File and Paper Storage ---
    def upload_file_to_storage(self, user_id: str, file_stream: IO[bytes], filename: str) -> str:
        """
        Uploads a file to Firebase Cloud Storage.

        Args:
            user_id (str): The user's UID to create a user-specific folder.
            file_stream (IO[bytes]): The file-like object to upload.
            filename (str): The desired filename in storage.

        Returns:
            str: The public URL of the uploaded file.
        """
        if not self.bucket:
            raise ConnectionError("Firebase Storage is not connected.")
        
        path = f"uploads/{user_id}/{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{filename}"
        blob = self.bucket.blob(path)
        
        # For resumable uploads with larger files, you might use blob.upload_from_file()
        # For smaller files, upload_from_string is efficient.
        file_stream.seek(0)
        blob.upload_from_file(file_stream)
        
        # Make the file publicly accessible (or use signed URLs for private access)
        blob.make_public()
        
        logger.info(f"Uploaded file '{filename}' to '{path}' for user {user_id}.")
        self.track_event(user_id, "file_uploaded", {"path": path, "filename": filename})
        return blob.public_url

    def store_generated_paper(self, user_id: str, paper_data: Dict) -> str:
        """Saves a compiled question paper/template to Firestore."""
        if not self.db:
            raise ConnectionError("Firestore is not connected.")
            
        paper_ref = self.db.collection('users').document(user_id).collection('generatedPapers').document()
        
        data_to_save = paper_data.copy()
        data_to_save['created_at'] = datetime.utcnow()
        
        paper_ref.set(data_to_save)
        logger.info(f"Stored generated paper {paper_ref.id} for user {user_id}.")
        return paper_ref.id

    # --- Analytics ---
    def track_event(self, user_id: str, event_name: str, details: Dict) -> None:
        """
        Tracks a user event for analytics purposes.

        Args:
            user_id (str): The user's UID.
            event_name (str): The name of the event (e.g., 'login', 'generate_questions').
            details (Dict): A dictionary with event-specific information.
        """
        if not self.db:
            logger.warning("Analytics tracking failed: Firestore is not connected.")
            return
        try:
            event_ref = self.db.collection('analytics').document(user_id).collection('events').document()
            event_data = {
                "event": event_name,
                "timestamp": datetime.utcnow(),
                "details": details
            }
            event_ref.set(event_data)
        except Exception as e:
            logger.error(f"Failed to track event '{event_name}' for user {user_id}: {e}", exc_info=True)

    def get_user_analytics(self, user_id: str) -> Dict[str, Any]:
        """
        Retrieves and summarizes usage analytics for a user.
        Note: This is a basic implementation. For production, use Cloud Functions
        to aggregate data to avoid expensive read operations.

        Returns:
            Dict[str, Any]: A summary of user activity.
        """
        if not self.db:
            raise ConnectionError("Firestore is not connected.")
            
        events_ref = self.db.collection('analytics').document(user_id).collection('events')
        docs = events_ref.stream()

        summary = {
            "total_events": 0,
            "event_counts": {},
            "last_activity": None
        }
        
        events = []
        for doc in docs:
            event = doc.to_dict()
            events.append(event)
        
        if not events:
            return summary

        summary['total_events'] = len(events)
        summary['last_activity'] = max(e['timestamp'] for e in events)

        for event in events:
            name = event.get('event')
            summary['event_counts'][name] = summary['event_counts'].get(name, 0) + 1
            
        logger.info(f"Retrieved analytics summary for user {user_id}.")
        return summary
