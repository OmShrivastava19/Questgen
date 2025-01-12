from flask import Flask
import pyrebase
from dotenv import load_dotenv
import os

app = Flask(__name__)

# Load environment variables
load_dotenv()

# Firebase Configuration
firebase_config = {
    "apiKey": os.getenv("API_KEY"),
    "authDomain": os.getenv("AUTH_DOMAIN"),
    "databaseURL": os.getenv("DATABASE_URL"),
    "projectId": os.getenv("PROJECT_ID"),
    "storageBucket": os.getenv("STORAGE_BUCKET"),
    "messagingSenderId": os.getenv("MESSAGING_SENDER_ID"),
    "appId": os.getenv("APP_ID"),
    "measurementId": os.getenv("MEASUREMENT_ID")
}

firebase = pyrebase.initialize_app(firebase_config)
db = firebase.database()

@app.route('/')
def home():
    return "🚀 QuestGen is Live!"

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=8080)



























# import pyrebase
# from dotenv import load_dotenv
# import os
# load_dotenv() # Load environment variables

# firebase_config = {
#     "apiKey": os.getenv("API_KEY"),
#     "authDomain": os.getenv("AUTH_DOMAIN"),
#     "databaseURL": os.getenv("DATABASE_URL"),
#     "projectId": os.getenv("PROJECT_ID"),
#     "storageBucket": os.getenv("STORAGE_BUCKET"),
#     "messagingSenderId": os.getenv("MESSAGING_SENDER_ID"),
#     "appId": os.getenv("APP_ID"),
#     "measurementId": os.getenv("MEASUREMENT_ID")
# }

# # Initialize Firebase
# firebase = pyrebase.initialize_app(firebase_config)
# db = firebase.database()

# # Function to input and upload data
# def upload_data():
#     while True:
#         # Input questions with categories and difficulty
#         standard = input("Enter the standard: ")
#         subject = input("Enter the subject: ")
#         chapter = input("Enter the chapter: ")
#         topic = input("Enter the topic: ")
#         question = input("Enter the question: ")
#         difficulty = input("Easy/Medium/Hard: ").lower().capitalize()

#         # Data structure
#         question_data = {
#             "Standard": standard,
#             "Subject": subject,
#             "Chapter": chapter,
#             "Topic": topic,
#             "Question": question,
#             "Difficulty": difficulty,
#         }
#         # Upload to Firebase under 'users' node
#         db.child("QuestGen").push(question_data)
#         print("✅ Data uploaded successfully!")
#         # Ask user if they want to continue
#         choice = input("Do you want to continue? (y/n): ")
#         if choice == 'n':
#             break

# # Function to fetch and display user data
# def fetch_data():
#     standard = input("Enter the standard: ")
#     subject = input("Enter the subject: ")
#     chapter = input("Enter the chapter: ")
#     topic = input("Enter the topic: ")
#     difficulty = input("Easy/Medium/Hard: ")

#     # Fetch data from Firebase
#     QuestGen = db.child("QuestGen").get()
#     print("📂 Fetching your type of questions:")
    
#     # Loop through each question
#     for question in QuestGen.each():
#         question_val = question.val()
#         if question_val["Standard"] == standard or question_val["Subject"] == subject or question_val["Chapter"] == chapter or question_val["Topic"] == topic or question_val["Difficulty"] == difficulty:
#             print("🔍 Question found!")
#             print("Question:", question_val["Question"])
#             break
#     else:
#         print("❌ Question not found!")

# # Main function
# print("🔥 Welcome to QuestGen!")
# print("📝 Input the questions and details to upload to Firebase.")
# print("📖 Fetch the data from Firebase.")
# print("🚀 Let's get started!")

# print("What do you want to do today?")
# print("1. Input and upload data")
# print("2. Fetch and display data")
# choice = int(input("Enter your choice: "))
# if choice == 1:
#     upload_data() # Call upload_data function
# elif choice == 2:
#     fetch_data() # Call fetch_data function
# else:
#     print("Invalid choice!") # Print error message