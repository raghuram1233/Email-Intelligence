import hashlib
import logging

from neo4j import GraphDatabase

logger = logging.getLogger(__name__)


def generate_claim_id(claim):
    base = f"{claim.type}|{claim.subject}|{claim.object or ''}|{claim.valid_from}"
    return hashlib.sha256(base.encode()).hexdigest()


def generate_evidence_id(claim_id: str, artifact_id: str, char_start: int) -> str:
    base = f"{claim_id}|{artifact_id}|{char_start}"
    return hashlib.sha256(base.encode()).hexdigest()


class Neo4jGraph:

    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    # ------------------------------------------------------------------
    # Individual write helpers (used inside a single transaction)
    # ------------------------------------------------------------------

    @staticmethod
    def _write_artifact(tx, artifact_id, subject, sender, timestamp):
        tx.run(
            """
            MERGE (a:Artifact {artifact_id: $artifact_id})
            SET a.title     = $subject,
                a.subject   = $subject,
                a.sender    = $sender,
                a.timestamp = $timestamp
            """,
            artifact_id=artifact_id,
            subject=subject,
            sender=sender,
            timestamp=str(timestamp),
        )

    @staticmethod
    def _write_entity(tx, entity):
        normalized = entity.email if entity.email else entity.name.lower()
        aliases_list = entity.aliases if entity.aliases else []
        tx.run(
            """
            MERGE (e:Entity {normalized_name: toLower($normalized_name)})
            ON CREATE SET
                e.title = $name,
                e.name  = $name,
                e.type  = $type,
                e.email = $email,
                e.aliases = $aliases
            ON MATCH SET
                e.aliases = $aliases
            """,
            normalized_name=normalized,
            name=entity.name,
            type=entity.type,
            email=entity.email,
            aliases=aliases_list,
        )

    @staticmethod
    def _write_claim(tx, claim):
        claim_id = generate_claim_id(claim)
        tx.run(
            """
            MERGE (s:Entity {normalized_name: toLower($subject)})
            ON CREATE SET s.name = $subject

            MERGE (c:Claim {claim_id: $claim_id})
            SET c.title      = $type,
                c.type       = $type,
                c.subject    = $subject,
                c.object     = $object,
                c.valid_from = $valid_from,
                c.event_time = $event_time,
                c.confidence = $confidence,
                c.valid_to   = $valid_to

            MERGE (s)-[:MADE_CLAIM]->(c)
            """,
            claim_id=claim_id,
            subject=claim.subject,
            type=claim.type,
            object=claim.object,
            valid_from=str(claim.valid_from) if claim.valid_from else None,
            event_time=str(claim.event_time) if claim.event_time else None,
            confidence=claim.confidence,
            valid_to=str(claim.valid_to) if claim.valid_to else None,
        )

    @staticmethod
    def _write_evidence(tx, claim, artifact_id, message_id):
        claim_id = generate_claim_id(claim)
        evidence_id = generate_evidence_id(claim_id, artifact_id, claim.evidence.char_start)
        tx.run(
            """
            MATCH (c:Claim    {claim_id:    $claim_id})
            MATCH (a:Artifact {artifact_id: $artifact_id})

            MERGE (e:Evidence {evidence_id: $evidence_id})
            ON CREATE SET
                e.title        = $quote,
                e.quote        = $quote,
                e.char_start   = $char_start,
                e.char_end     = $char_end,
                e.message_id   = $message_id,
                e.extracted_at = datetime()

            MERGE (c)-[:SUPPORTED_BY]->(e)
            MERGE (e)-[:FROM_ARTIFACT]->(a)
            """,
            claim_id=claim_id,
            artifact_id=artifact_id,
            evidence_id=evidence_id,
            message_id=message_id,
            quote=claim.evidence.quote,
            char_start=claim.evidence.char_start,
            char_end=claim.evidence.char_end,
        )

    # ------------------------------------------------------------------
    # Public API — single transaction per email (batched writes)
    # ------------------------------------------------------------------

    def insert_full(self, extracted_output, artifact_id, subject, sender, timestamp, message_id):
        def _do_all(tx):
            self._write_artifact(tx, artifact_id, subject, sender, timestamp)
            for entity in extracted_output.entities:
                self._write_entity(tx, entity)
            for claim in extracted_output.claims:
                self._write_claim(tx, claim)
                self._write_evidence(tx, claim, artifact_id, message_id)

        with self.driver.session() as session:
            session.execute_write(_do_all)
            logger.debug("Inserted artifact %s with %d entities and %d claims.",
                         artifact_id, len(extracted_output.entities), len(extracted_output.claims))
