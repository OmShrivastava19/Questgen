# backend/app/services/question_generator.py

import logging
import re
import random
from typing import List, Dict, Any, Tuple, Optional

# Global flag for AI availability
AI_AVAILABLE = False
logger = logging.getLogger(__name__)

# NLTK imports (should always work)
try:
    import nltk
    from nltk.tokenize import sent_tokenize, word_tokenize
    from nltk.corpus import stopwords
    
    # Download NLTK data if not available
    try:
        nltk.data.find('tokenizers/punkt')
        nltk.data.find('corpora/stopwords')
    except LookupError:
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        
except ImportError as e:
    logger.error(f"NLTK not available: {e}")
    # Create minimal fallback functions
    def sent_tokenize(text):
        return text.split('.')
    def word_tokenize(text):
        return text.split()
    stopwords = set()

logger = logging.getLogger(__name__)

class QuestionGenerator:
    """
    AI-powered question generator using HuggingFace T5 models with fallback to rule-based generation.
    
    This service generates high-quality educational questions using T5 transformers when available,
    and falls back to intelligent rule-based generation when AI models are not accessible.
    """

    def __init__(self, model_name: str = "t5-small"):
        """
        Initializes the QuestionGenerator with T5 model or fallback.

        Args:
            model_name (str): The T5 model to use. Options:
                - "t5-small": Fast, lightweight model (default)
                - "t5-base": Balanced performance and quality
                - "allenai/unifiedqa-t5-small": Specialized for Q&A
                - "rule-based": Force rule-based generation
        """
        self.model_name = model_name
        self.device = None
        self.tokenizer = None
        self.model = None
        self.question_generator = None
        self.torch = None  # store torch module when available
        self.stop_words = set(stopwords.words('english')) if hasattr(stopwords, 'words') else set()
        
        # Initialize based on availability
        if AI_AVAILABLE and model_name != "rule-based":
            self._load_ai_model()
        else:
            self._use_rule_based()
        
        logger.info(f"QuestionGenerator initialized with {self.model_name}")

    def _load_ai_model(self):
        """Loads and initializes the T5 model and tokenizer."""
        try:
            logger.info(f"Loading T5 model: {self.model_name}")
            
            # Try to import AI libraries dynamically
            try:
                import torch
                from transformers import T5Tokenizer, T5ForConditionalGeneration, pipeline
                global AI_AVAILABLE
                AI_AVAILABLE = True
                logger.info("AI libraries (torch, transformers) successfully imported")
            except ImportError as e:
                logger.error(f"AI libraries not available: {e}")
                self._use_rule_based()
                return
            
            # Check if torch is working
            try:
                self.torch = torch
                self.device = self.torch.device("cuda" if self.torch.cuda.is_available() else "cpu")
                logger.info(f"PyTorch device: {self.device}")
            except Exception as e:
                logger.error(f"PyTorch device detection failed: {e}")
                self._use_rule_based()
                return
            
            # Load tokenizer
            self.tokenizer = T5Tokenizer.from_pretrained(self.model_name)
            
            # Load model
            self.model = T5ForConditionalGeneration.from_pretrained(
                self.model_name,
                torch_dtype=self.torch.float32 if self.device.type == "cpu" else self.torch.float16
            )
            self.model.to(self.device)
            self.model.eval()
            
            # Initialize question generation pipeline
            self.question_generator = pipeline(
                "text2text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                device=0 if self.device.type == "cuda" else -1
            )
            
            logger.info(f"T5 model {self.model_name} loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load T5 model: {e}")
            # Fallback to rule-based generation
            self._use_rule_based()
    
    def _use_rule_based(self):
        """Switch to rule-based generation mode."""
        logger.info("Using rule-based question generation")
        self.model_name = "rule-based"
        self.device = None
        self.tokenizer = None
        self.model = None
        self.question_generator = None

    def _validate_question(self, question: str, question_type: str) -> bool:
        """
        Performs comprehensive validation on a generated question.
        
        Args:
            question (str): The question text.
            question_type (str): The type of question.
            
        Returns:
            bool: True if the question is valid, False otherwise.
        """
        if not question or not isinstance(question, str):
            return False
        
        # Length validation
        if len(question.strip()) < 10:
            return False
        
        # Question mark validation
        if not question.strip().endswith('?'):
            return False
        
        # Content validation
        if question.strip().lower() in ['', 'none', 'error', 'failed']:
            return False
            
        return True

    def _score_question_quality(self, question: str, context: str) -> float:
        """
        Provides AI-enhanced quality scoring for generated questions.
        
        Scoring criteria:
        - Question length and complexity
        - Presence of question words
        - Relevance to context
        - Educational value
        
        Returns:
            float: A score between 0.0 and 1.0.
        """
        score = 0.5  # Base score
        
        # Question word bonus
        question_words = ["what", "who", "when", "where", "why", "how", "which", "explain", "describe", "compare"]
        if any(word in question.lower() for word in question_words):
            score += 0.2
        
        # Length bonus (optimal range: 20-100 words)
        word_count = len(word_tokenize(question))
        if 20 <= word_count <= 100:
            score += 0.2
        elif 10 <= word_count < 20 or 100 < word_count <= 150:
            score += 0.1
        
        # Context relevance bonus
        context_words = set(word_tokenize(context.lower()))
        question_words_set = set(word_tokenize(question.lower()))
        common_words = context_words.intersection(question_words_set)
        if len(common_words) >= 2:
            score += 0.1
        
        return min(1.0, score)

    def _generate_ai_question(self, context: str, question_type: str, difficulty: int = 3) -> str:
        """
        Generates a question using T5 model with specific prompting.
        
        Args:
            context (str): The text context to generate questions from.
            question_type (str): Type of question to generate.
            difficulty (int): Difficulty level (1-5).
            
        Returns:
            str: Generated question text.
        """
        if not self.question_generator:
            return self._generate_rule_based_question(context, question_type, difficulty)
        
        try:
            # Create context-aware prompts for different question types
            prompts = {
                "mcq": f"Generate a multiple choice question from this text: {context[:500]}",
                "true_false": f"Generate a true/false question from this text: {context[:500]}",
                "short_answer": f"Generate a short answer question from this text: {context[:500]}",
                "long_answer": f"Generate a detailed question requiring explanation from this text: {context[:500]}",
                "hots": f"Generate a higher-order thinking question from this text: {context[:500]}"
            }
            
            prompt = prompts.get(question_type, prompts["mcq"])
            
            # Generate with T5
            with self.torch.no_grad():
                inputs = self.tokenizer.encode(prompt, return_tensors="pt", max_length=512, truncation=True)
                inputs = inputs.to(self.device)
                
                outputs = self.model.generate(
                    inputs,
                    max_length=100,
                    num_beams=4,
                    no_repeat_ngram_size=2,
                    temperature=0.7 + (difficulty * 0.1),  # Higher difficulty = more creative
                    do_sample=True,
                    top_k=50,
                    top_p=0.95,
                    early_stopping=True
                )
                
                generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                
                # Clean and format the generated question
                question = self._clean_generated_text(generated_text, question_type)
                
                return question
                
        except Exception as e:
            logger.error(f"T5 generation failed for {question_type}: {e}")
            return self._generate_rule_based_question(context, question_type, difficulty)

    def _clean_generated_text(self, text: str, question_type: str) -> str:
        """
        Cleans and formats generated text to ensure it's a valid question.
        
        Args:
            text (str): Raw generated text.
            question_type (str): Type of question being generated.
            
        Returns:
            str: Cleaned question text.
        """
        # Remove extra whitespace and newlines
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Ensure it ends with a question mark
        if not text.endswith('?'):
            text += '?'
        
        # Capitalize first letter
        if text and text[0].islower():
            text = text[0].upper() + text[1:]
        
        # Remove common artifacts
        text = re.sub(r'^(question|q|answer|a):\s*', '', text, flags=re.IGNORECASE)
        
        return text

    def _generate_rule_based_question(self, context: str, question_type: str, difficulty: int = 3) -> str:
        """
        Intelligent rule-based question generation when AI is not available.
        """
        # Extract key concepts from context
        sentences = context.split('.')
        if not sentences:
            return "What is the main topic of this text?"
        
        # Use the first meaningful sentence
        first_sentence = sentences[0].strip()
        if len(first_sentence) < 20:
            first_sentence = context[:100] + "..."
        
        if question_type == "mcq":
            return f"What is the main topic discussed in: '{first_sentence[:50]}...'?"
        elif question_type == "true_false":
            return "The text contains factual information that can be verified?"
        elif question_type == "short_answer":
            return "What are the key points discussed in this text?"
        elif question_type == "long_answer":
            return "Explain in detail the main concepts and their relationships as discussed in this text."
        elif question_type == "hots":
            return "How would you apply the concepts from this text to solve a real-world problem?"
        else:
            return "What is the main topic discussed in this text?"

    def _generate_mcq_from_context(self, context: str, difficulty: int = 3) -> Tuple[str, List[str], str]:
        """
        Generates a multiple choice question with distractors.
        
        Args:
            context (str): Text context for question generation.
            difficulty (int): Difficulty level (1-5).
            
        Returns:
            Tuple[str, List[str], str]: (question, options, correct_answer)
        """
        # Generate the main question
        if self.question_generator:
            question = self._generate_ai_question(context, "mcq", difficulty)
        else:
            question = self._generate_rule_based_question(context, "mcq", difficulty)
        
        # Generate distractors
        if self.question_generator:
            try:
                # Generate plausible distractors using AI
                distractor_prompt = f"Generate 3 incorrect but plausible answers for this question: {question}"
                
                with self.torch.no_grad():
                    inputs = self.tokenizer.encode(distractor_prompt, return_tensors="pt", max_length=200, truncation=True)
                    inputs = inputs.to(self.device)
                    
                    outputs = self.model.generate(
                        inputs,
                        max_length=50,
                        num_beams=3,
                        temperature=0.8,
                        do_sample=True,
                        top_k=30
                    )
                    
                    distractors_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                    
                    # Parse distractors (simple approach)
                    distractors = [d.strip() for d in distractors_text.split(',') if d.strip()]
                    distractors = distractors[:3]  # Take first 3
                    
                    # Ensure we have enough distractors
                    while len(distractors) < 3:
                        distractors.append(f"Option {chr(66 + len(distractors))}")
                    
            except Exception as e:
                logger.error(f"Failed to generate AI distractors: {e}")
                distractors = self._generate_rule_based_distractors(context)
        else:
            distractors = self._generate_rule_based_distractors(context)
        
        # Generate correct answer
        if self.question_generator:
            correct_answer = self._generate_ai_question(context, "short_answer", difficulty)
            if not correct_answer or len(correct_answer) < 5:
                correct_answer = "The main topic of the text"
        else:
            correct_answer = "The main topic of the text"
        
        # Create options list
        options = [correct_answer] + distractors
        random.shuffle(options)  # Randomize order
        
        return question, options, correct_answer

    def _generate_rule_based_distractors(self, context: str) -> List[str]:
        """Generate rule-based distractors when AI is not available."""
        return [
            "A secondary topic",
            "An unrelated subject", 
            "None of the above"
        ]

    def _generate_true_false_from_context(self, context: str) -> Tuple[str, bool]:
        """
        Generates a true/false question.
        
        Args:
            context (str): Text context for question generation.
            
        Returns:
            Tuple[str, bool]: (question, correct_answer)
        """
        if self.question_generator:
            question = self._generate_ai_question(context, "true_false", 3)
        else:
            question = self._generate_rule_based_question(context, "true_false", 3)
        
        # Determine answer based on context content
        # Simple heuristic: if context contains factual statements, answer is True
        factual_indicators = ["is", "are", "was", "were", "has", "have", "had", "consists", "contains", "includes"]
        answer = any(indicator in context.lower() for indicator in factual_indicators)
        
        return question, answer

    def _generate_short_answer_from_context(self, context: str) -> str:
        """
        Generates a short answer question.
        
        Args:
            context (str): Text context for question generation.
            
        Returns:
            str: Generated question.
        """
        if self.question_generator:
            return self._generate_ai_question(context, "short_answer", 3)
        else:
            return self._generate_rule_based_question(context, "short_answer", 3)

    def _generate_long_answer_from_context(self, context: str) -> str:
        """
        Generates a long answer question.
        
        Args:
            context (str): Text context for question generation.
            
        Returns:
            str: Generated question.
        """
        if self.question_generator:
            return self._generate_ai_question(context, "long_answer", 4)
        else:
            return self._generate_rule_based_question(context, "long_answer", 4)

    def _generate_hots_from_context(self, context: str) -> str:
        """
        Generates a Higher Order Thinking Skills question.
        
        Args:
            context (str): Text context for question generation.
            
        Returns:
            str: Generated question.
        """
        if self.question_generator:
            return self._generate_ai_question(context, "hots", 5)
        else:
            return self._generate_rule_based_question(context, "hots", 5)

    def generate_questions(self, context_chunks: List[str], config: Dict[str, Any]) -> Dict[str, List[Dict]]:
        """
        Generates a batch of questions based on text chunks and configuration.

        Args:
            context_chunks (List[str]): List of text segments to generate questions from.
            config (Dict[str, Any]): Configuration specifying question types and counts.

        Returns:
            Dict[str, List[Dict]]: Dictionary containing questions and answer key.
        """
        questions = []
        answer_key = []
        
        # Handle edge cases
        if not context_chunks:
            logger.warning("No context chunks provided for question generation.")
            return {"questions": questions, "answer_key": answer_key}
        
        # Filter out empty or very short contexts
        valid_contexts = [ctx for ctx in context_chunks if ctx and len(ctx.strip()) > 10]
        if not valid_contexts:
            logger.warning("No valid context chunks found for question generation.")
            return {"questions": questions, "answer_key": answer_key}
        
        question_types_map = {
            "num_mcq": "mcq",
            "num_true_false": "true_false",
            "num_short_answer": "short_answer",
            "num_long_answer": "long_answer",
            "num_hots": "hots"
        }

        for key, q_type in question_types_map.items():
            num_questions = config.get(key, 0)
            for i in range(num_questions):
                # Cycle through valid context chunks to ensure variety
                context = valid_contexts[i % len(valid_contexts)]
                
                logger.info(f"Generating {q_type} question {i+1}/{num_questions} using {self.model_name}...")
                
                try:
                    if q_type == "mcq":
                        question_text, options, correct_answer = self._generate_mcq_from_context(
                            context, config.get('difficulty', 3)
                        )
                        
                        if self._validate_question(question_text, q_type):
                            question_obj = {
                                "type": "mcq",
                                "question": question_text,
                                "options": options,
                                "quality_score": self._score_question_quality(question_text, context),
                                "difficulty": config.get('difficulty', 3),
                                "model_used": self.model_name
                            }
                            questions.append(question_obj)
                            answer_key.append({"question": question_text, "answer": correct_answer})
                            
                    elif q_type == "true_false":
                        question_text, answer = self._generate_true_false_from_context(context)
                        
                        if self._validate_question(question_text, q_type):
                            question_obj = {
                                "type": "true_false",
                                "question": question_text,
                                "quality_score": self._score_question_quality(question_text, context),
                                "difficulty": config.get('difficulty', 3),
                                "model_used": self.model_name
                            }
                            questions.append(question_obj)
                            answer_key.append({"question": question_text, "answer": str(answer)})
                            
                    elif q_type == "short_answer":
                        question_text = self._generate_short_answer_from_context(context)
                        
                        if self._validate_question(question_text, q_type):
                            question_obj = {
                                "type": "short_answer",
                                "question": question_text,
                                "quality_score": self._score_question_quality(question_text, context),
                                "difficulty": config.get('difficulty', 3),
                                "model_used": self.model_name
                            }
                            questions.append(question_obj)
                            answer_key.append({"question": question_text, "answer": "Key points from the text"})
                            
                    elif q_type == "long_answer":
                        question_text = self._generate_long_answer_from_context(context)
                        
                        if self._validate_question(question_text, q_type):
                            question_obj = {
                                "type": "long_answer",
                                "question": question_text,
                                "quality_score": self._score_question_quality(question_text, context),
                                "difficulty": config.get('difficulty', 3),
                                "model_used": self.model_name
                            }
                            questions.append(question_obj)
                            answer_key.append({"question": question_text, "answer": "Detailed explanation required"})
                            
                    elif q_type == "hots":
                        question_text = self._generate_hots_from_context(context)
                        
                        if self._validate_question(question_text, q_type):
                            question_obj = {
                                "type": "hots",
                                "question": question_text,
                                "quality_score": self._score_question_quality(question_text, context),
                                "difficulty": config.get('difficulty', 3),
                                "model_used": self.model_name
                            }
                            questions.append(question_obj)
                            answer_key.append({"question": question_text, "answer": "Application and analysis required"})
                            
                except Exception as e:
                    logger.error(f"Failed to generate {q_type} question: {e}")
                    continue

        logger.info(f"Generated {len(questions)} questions successfully using {self.model_name}")
        return {"questions": questions, "answer_key": answer_key}

    def get_model_info(self) -> Dict[str, Any]:
        """
        Returns information about the loaded model.
        
        Returns:
            Dict[str, Any]: Model information including name, device, and status.
        """
        return {
            "model_name": self.model_name,
            "device": str(self.device) if self.device else "N/A",
            "model_loaded": self.model is not None,
            "tokenizer_loaded": self.tokenizer is not None,
            "ai_available": AI_AVAILABLE,
            "fallback_mode": self.model_name == "rule-based"
        }

# --- Example Usage ---
if __name__ == '__main__':
    print("--- Running T5 QuestionGenerator Example ---")
    
    # Example context about the solar system
    example_context = [
        "The solar system is the gravitationally bound system of the Sun and the objects that orbit it. "
        "Of the bodies that orbit the Sun directly, the largest are the eight planets, with the remainder being smaller objects, "
        "the dwarf planets and small Solar System bodies. Jupiter is the largest planet, while Mercury is the smallest.",
        
        "Mars is known as the Red Planet due to the iron oxide prevalent on its surface, which gives it a reddish appearance. "
        "It is a terrestrial planet with a thin atmosphere, having surface features reminiscent both of the impact craters of the Moon "
        "and the volcanoes, valleys, deserts, and polar ice caps of Earth."
    ]

    # Configuration for the desired questions
    generation_config = {
        "num_mcq": 1,
        "num_true_false": 1,
        "num_short_answer": 1,
        "num_hots": 1,
        "difficulty": 3,  # Medium difficulty
        "curriculum": "General Science",
        "subject": "Astronomy"
    }
    
    try:
        # Initialize the generator
        qg = QuestionGenerator(model_name="t5-small")
        
        # Get model info
        print("\n--- Model Information ---")
        print(qg.get_model_info())
        
        # Generate the questions
        results = qg.generate_questions(example_context, generation_config)
        
        # Print the results
        import json
        print("\n--- Generated Questions ---")
        print(json.dumps(results['questions'], indent=2))
        
        print("\n--- Answer Key ---")
        print(json.dumps(results['answer_key'], indent=2))

    except Exception as e:
        print(f"\nAn error occurred: {e}")
        import traceback
        traceback.print_exc()

