"""
Central configuration — reads from .env (or real environment variables).
All other modules import from here instead of hardcoding values.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Neo4j
NEO4J_URI = os.getenv("NEO4J_URI", "neo4j://127.0.0.1:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")

# Ollama / LLM
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL_NAME = os.getenv("MODEL_NAME", "mistral:latest")

# Pipeline
CSV_PATH = os.getenv("CSV_PATH", "sample_5.csv")
PROGRESS_FILE = "progress.json"
