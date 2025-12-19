# backend/tests/test_question_generator.py

import pytest
from app.services.question_generator import QuestionGenerator

def test_question_generator_initialization():
    """Test that QuestionGenerator initializes correctly."""
    qg = QuestionGenerator()
    # The model name might be "t5-small" if AI is available, or "rule-based" if fallback
    assert qg.model_name in ["t5-small", "rule-based"]
    assert qg is not None

def test_question_validation():
    """Test question validation logic."""
    qg = QuestionGenerator()
    
    # Valid questions
    assert qg._validate_question("What is the capital of France?", "mcq") == True
    assert qg._validate_question("This is a valid question with more than 10 characters?", "short_answer") == True
    
    # Invalid questions
    assert qg._validate_question("Short?", "mcq") == False  # Too short
    assert qg._validate_question("This is a question without question mark", "mcq") == False  # No question mark
    assert qg._validate_question("", "mcq") == False  # Empty
    assert qg._validate_question(None, "mcq") == False  # None

def test_question_quality_scoring():
    """Test question quality scoring."""
    qg = QuestionGenerator()
    
    # Test scoring with good question
    score = qg._score_question_quality("What is the main topic discussed in this text?", "context")
    assert 0.5 <= score <= 1.0
    
    # Test scoring with question containing question words
    score = qg._score_question_quality("How does this process work?", "context")
    assert score > 0.5

def test_generate_mcq_questions():
    """Test MCQ question generation."""
    qg = QuestionGenerator()
    
    context = "The solar system consists of the Sun and the planets that orbit around it."
    config = {"num_mcq": 1, "difficulty": 3}
    
    results = qg.generate_questions([context], config)
    
    assert "questions" in results
    assert "answer_key" in results
    assert len(results["questions"]) == 1
    assert results["questions"][0]["type"] == "mcq"
    assert "options" in results["questions"][0]
    assert len(results["questions"][0]["options"]) == 4

def test_generate_true_false_questions():
    """Test true/false question generation."""
    qg = QuestionGenerator()
    
    context = "The Earth is round and orbits the Sun."
    config = {"num_true_false": 1}
    
    results = qg.generate_questions([context], config)
    
    assert len(results["questions"]) == 1
    assert results["questions"][0]["type"] == "true_false"

def test_generate_short_answer_questions():
    """Test short answer question generation."""
    qg = QuestionGenerator()
    
    context = "Photosynthesis is the process by which plants convert sunlight into energy."
    config = {"num_short_answer": 1}
    
    results = qg.generate_questions([context], config)
    
    assert len(results["questions"]) == 1
    assert results["questions"][0]["type"] == "short_answer"

def test_generate_multiple_question_types():
    """Test generating multiple types of questions."""
    qg = QuestionGenerator()
    
    context = "The human body is made up of many different systems working together."
    config = {
        "num_mcq": 2,
        "num_true_false": 1,
        "num_short_answer": 1
    }
    
    results = qg.generate_questions([context], config)
    
    total_questions = len(results["questions"])
    expected_total = config["num_mcq"] + config["num_true_false"] + config["num_short_answer"]
    
    assert total_questions == expected_total
    
    # Check that we have the right types
    question_types = [q["type"] for q in results["questions"]]
    assert question_types.count("mcq") == 2
    assert question_types.count("true_false") == 1
    assert question_types.count("short_answer") == 1

def test_generate_questions_with_multiple_contexts():
    """Test question generation with multiple context chunks."""
    qg = QuestionGenerator()
    
    contexts = [
        "The solar system has eight planets.",
        "Mars is known as the Red Planet.",
        "Jupiter is the largest planet in our solar system."
    ]
    
    config = {"num_mcq": 3}
    
    results = qg.generate_questions(contexts, config)
    
    assert len(results["questions"]) == 3
    assert all(q["type"] == "mcq" for q in results["questions"])

def test_question_generation_edge_cases():
    """Test question generation with edge cases."""
    qg = QuestionGenerator()
    
    # Empty context
    results = qg.generate_questions([""], {"num_mcq": 1})
    assert len(results["questions"]) == 0
    
    # Very short context
    results = qg.generate_questions(["Hi"], {"num_mcq": 1})
    assert len(results["questions"]) == 0
    
    # No questions requested
    results = qg.generate_questions(["Long context text here"], {})
    assert len(results["questions"]) == 0

def test_answer_key_generation():
    """Test that answer keys are properly generated."""
    qg = QuestionGenerator()
    
    context = "The water cycle involves evaporation, condensation, and precipitation."
    config = {"num_mcq": 1, "num_true_false": 1}
    
    results = qg.generate_questions([context], config)
    
    assert len(results["answer_key"]) == len(results["questions"])
    
    # Check that each answer key has the required fields
    for answer in results["answer_key"]:
        assert "question" in answer
        assert "answer" in answer
        assert answer["question"] is not None
        assert answer["answer"] is not None
