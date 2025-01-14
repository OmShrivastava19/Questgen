# Questgen

## Project Overview
**Questgen** is an intelligent Question Bank Randomizer designed to streamline exam creation. Users can upload question files, classify questions by difficulty (Easy, Medium, Hard), and generate randomized question papers along with separate solution PDFs. Questgen automates and customizes the test generation process, making exam preparation efficient and dynamic.

## Key Features
- **Upload Questions:** Upload PDFs or manually input questions into the system.
- **Difficulty Levels:** Categorize questions into Easy, Medium, and Hard.
- **Randomized Question Papers:** Generate randomized question sets based on chosen difficulty levels.
- **Separate Solution PDFs:** Automatically generate a solutions PDF.
- **Multiple Paper Sets:** Create multiple unique exam sets (Set A, B, C).
- **Customizable Output:** Add headers, footers, institute logos, and page numbers in PDFs.

## Project Workflow
1. **Upload Questions:** Upload PDFs or input questions manually.
2. **Categorization:** Classify questions by difficulty level.
3. **Set Preferences:** Define the number of questions per difficulty and paper format.
4. **Randomization:** The system selects and shuffles questions accordingly.
5. **Solution Linking:** Pairs solutions with respective questions.
6. **PDF Generation:** Generate two separate PDFs:
   - **Question Paper PDF**
   - **Solutions PDF**
7. **Download/Share:** Download PDFs or share securely.

## Tech Stack
- **Backend:** Python
- **Database:** 
- **PDF Generation:** ReportLab, PyPDF2
- **OCR (PDF extraction):** Tesseract OCR

## Installation
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/OmShrivastava19/Questgen.git
   cd Questgen
   ```
2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Run the Application:**
   ```bash
   python app.py
   ```
4. **Access in Browser:**
   Open `http://localhost:5000` in your browser.

## Usage
1. Upload your question file (PDF/Manual Entry).
2. Classify questions or let the system auto-classify.
3. Set preferences for question paper generation.
4. Generate and download the question and solution PDFs.

## Future Enhancements
- **Auto Difficulty Detection** using NLP algorithms.
- **Cloud Storage Integration** for secure file handling.
- **User Authentication** for personalized accounts.
- **Analytics Dashboard** to track question usage.

## License
This project is licensed under the MIT License.

## Contact
- **Developer:** Om Shrivastava  
- **GitHub:** [OmShrivastava19](https://github.com/OmShrivastava19)  
- **LinkedIn:** [Om Shrivastava](https://www.linkedin.com/in/omshrivastava)

---

Thank you for using **Questgen**! 🚀