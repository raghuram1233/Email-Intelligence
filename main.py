import json
import logging
import os

import neo4j.exceptions

import config
from deduper import deduplicate_claims
from extraction import extract_structured, hash_artifact, load_emails
from graph_builder import Neo4jGraph
from normalizer import verify_and_fix_evidence

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def process_row(idx, row, graph):
    result, cleaned_body, timestamp_utc, sender = extract_structured(row)

    if not result:
        logger.info("Row %d: no structured output, skipping.", idx)
        return

    artifact_id = hash_artifact(cleaned_body)  # type: ignore
    message_id = row.get("message-id", "unknown")

    valid_claims = [
        claim
        for claim in result.claims
        if verify_and_fix_evidence(cleaned_body, claim)  # type: ignore
    ]

    # Deduplicate claims before writing (#7)
    valid_claims = deduplicate_claims(valid_claims)
    result.claims = valid_claims

    graph.insert_full(
        result,
        artifact_id,
        row.get("subject", ""),
        sender,
        timestamp_utc,
        message_id,
    )

    logger.info("Row %d processed — %d claims, %d entities.", idx, len(valid_claims), len(result.entities))


def load_progress(path: str) -> int:
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f).get("last_index", 0)
    return 0


def save_progress(path: str, idx: int):
    with open(path, "w") as f:
        json.dump({"last_index": idx + 1}, f)


def main():
    graph = Neo4jGraph(config.NEO4J_URI, config.NEO4J_USER, config.NEO4J_PASSWORD)
    df = load_emails(config.CSV_PATH)
    start_index = load_progress(config.PROGRESS_FILE)

    logger.info("Resuming from row index %d / %d total rows.", start_index, len(df))

    try:
        for idx in range(start_index, len(df)):
            row = df.iloc[idx]

            try:
                process_row(idx, row, graph)
                save_progress(config.PROGRESS_FILE, idx)

            except neo4j.exceptions.ServiceUnavailable as exc:
                # Database is unreachable — stop safely so progress is not advanced
                logger.error("Neo4j unavailable at row %d: %s — stopping.", idx, exc)
                break

            except Exception as exc:
                # Any other error: log, skip this row, continue with the next
                logger.warning("Error at row %d: %s — skipping row.", idx, exc)
                save_progress(config.PROGRESS_FILE, idx)

    finally:
        graph.close()
        logger.info("Processing complete.")


if __name__ == "__main__":
    main()