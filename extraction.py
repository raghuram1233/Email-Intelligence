import logging
import time
import pandas as pd
import hashlib
import json
from email import policy
from email.parser import Parser
from email.utils import parsedate_to_datetime, parseaddr
from typing import Optional

import pytz
import requests

from config import OLLAMA_URL, MODEL_NAME
from models import ExtractedOutput
from normalizer import deduplicate_entities
from prompts import build_extraction_prompt

logger = logging.getLogger(__name__)

# Retry settings for LLM calls
_LLM_MAX_RETRIES = 3
_LLM_RETRY_DELAY = 2  # seconds, doubled on each attempt


def load_emails(csv_path: str):
    df = pd.read_csv(csv_path)
    df.fillna("", inplace=True)
    df.columns = [c.lower() for c in df.columns]

    if "message" in df.columns:
        df["body"] = df["message"]
    elif "content" in df.columns:
        df["body"] = df["content"]
    else:
        raise ValueError(
            f"CSV at '{csv_path}' has neither a 'message' nor a 'content' column. "
            f"Found columns: {list(df.columns)}"
        )

    return df


def normalize_email_timestamp(date_str):
    dt = parsedate_to_datetime(date_str)
    return dt.astimezone(pytz.UTC)


def clean_body(body: str):
    lines = body.split("\n")
    cleaned = []
    for line in lines:
        if line.strip().startswith(">"):
            continue
        if "-----Original Message-----" in line:
            break
        cleaned.append(line)
    return "\n".join(cleaned)


def hash_artifact(text: str):
    return hashlib.sha256(text.encode()).hexdigest()


def call_llm(prompt: str) -> Optional[str]:
    """Call Ollama with exponential backoff on transient failures."""
    delay = _LLM_RETRY_DELAY
    for attempt in range(1, _LLM_MAX_RETRIES + 1):
        try:
            response = requests.post(
                OLLAMA_URL,
                json={
                    "model": MODEL_NAME,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                    "options": {
                        "num_predict": 2048,
                        "temperature": 0.0,
                        "num_thread": 12,
                    },
                },
                timeout=120,
            )
        except requests.RequestException as exc:
            logger.warning("LLM request failed (attempt %d/%d): %s", attempt, _LLM_MAX_RETRIES, exc)
            if attempt < _LLM_MAX_RETRIES:
                time.sleep(delay)
                delay *= 2
            continue

        if response.status_code != 200:
            logger.warning(
                "LLM returned HTTP %d (attempt %d/%d): %s",
                response.status_code, attempt, _LLM_MAX_RETRIES, response.text[:200],
            )
            if attempt < _LLM_MAX_RETRIES:
                time.sleep(delay)
                delay *= 2
            continue

        return response.json()["response"]

    logger.error("LLM call failed after %d attempts.", _LLM_MAX_RETRIES)
    return None


def extract_structured(email_row):
    raw_text = email_row["message"]
    subject, sender, date, body = parse_raw_email(raw_text)
    date = str(normalize_email_timestamp(date))
    cleaned_body = str(clean_body(body))

    logger.debug("Subject: %s | Sender: %s | Date: %s", subject, sender, date)
    logger.debug("Cleaned body:\n%s", cleaned_body)

    prompt = build_extraction_prompt(
        subject=subject,
        body=cleaned_body,
        sender=sender,
        timestamp=date,
    )

    raw_output = call_llm(prompt)
    logger.debug("LLM raw output:\n%s", raw_output)

    if raw_output is None:
        return None, None, None, None

    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError:
        logger.warning("Invalid JSON from LLM, skipping row.")
        return None, None, None, None

    cleaned_claims = []
    sender_normalized = sender.lower().strip()
    email_date = date

    ALLOWED_TYPES = {
        "MeetingPlan",
        "Decision",
        "Intent",
        "Commitment",
        "Ownership",
        "RoleAssignment",
        "FinancialStatement",
        "Misc",
    }

    for claim in data.get("claims", []):
        if claim.get("type") not in ALLOWED_TYPES:
            continue

        if claim.get("type") == "Misc":
            continue

        # Fix #3: Only fall back to sender when subject is truly absent/empty.
        # Do NOT overwrite a plausible name supplied by the LLM.
        if not claim.get("subject"):
            claim["subject"] = sender_normalized
        elif "@" in claim["subject"]:
            # Normalise email addresses
            claim["subject"] = claim["subject"].lower().strip()
        # else: keep the LLM-supplied name as-is

        if not claim.get("event_time"):
            claim["event_time"] = email_date

        if not claim.get("valid_from"):
            claim["valid_from"] = claim["event_time"]

        if not claim.get("evidence"):
            continue

        if claim.get("type") == "MeetingPlan":
            obj = claim.get("object")
            if obj and "@" not in obj and len(obj.split()) <= 2:
                quote_original = claim["evidence"]["quote"]
                quote_lower = quote_original.lower()

                if "schedule of" in quote_lower:
                    start = quote_lower.find("schedule of")
                    claim["object"] = quote_original[start:].strip()
                elif "meeting" in quote_lower:
                    claim["object"] = quote_original.strip()
                elif "plan" in quote_lower:
                    claim["object"] = quote_original.strip()

        cleaned_claims.append(claim)

    data["claims"] = cleaned_claims

    try:
        parsed = ExtractedOutput(**data)
        parsed.entities = deduplicate_entities(parsed.entities)
        return parsed, cleaned_body, date, sender
    except Exception as e:
        logger.warning("Pydantic validation failed after cleaning: %s", e)
        return None, None, None, None


def parse_raw_email(raw_text):
    msg = Parser(policy=policy.default).parsestr(raw_text)

    subject = msg["subject"]
    _, sender_email = parseaddr(msg["from"])
    sender = sender_email.lower().strip()
    date = msg["date"]

    if msg.is_multipart():
        body = ""
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                body += part.get_content()
    else:
        body = msg.get_content()

    return subject, sender, date, body