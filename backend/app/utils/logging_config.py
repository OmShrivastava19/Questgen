# backend/app/utils/logging_config.py

import logging
import sys

def setup_logging():
    """
    Configures the root logger for the application.

    This setup uses a standard format that includes a timestamp, the logger's name,
    the logging level, and the message. It ensures that log messages from all
    modules that use the standard logging library will be captured and formatted
    consistently.
    """
    # Get the root logger
    root_logger = logging.getLogger()
    
    # Set the default logging level. INFO is a good default.
    # It captures informational messages, warnings, and errors.
    root_logger.setLevel(logging.INFO)

    # Create a handler to output logs to the console (standard error)
    handler = logging.StreamHandler(sys.stderr)

    # Create a formatter to define the structure of log messages
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Set the formatter for the handler
    handler.setFormatter(formatter)

    # Add the handler to the root logger
    # This check prevents adding duplicate handlers if the function is called more than once.
    if not root_logger.handlers:
        root_logger.addHandler(handler)

    logging.info("Logging configured successfully.")

