from app.db import Database

_qa_counter = {"count": 0}


def increment_qa_counter():
    _qa_counter["count"] += 1


class StatsService:
    @staticmethod
    def stats():
        counts = Database.read(
            """
            OPTIONAL MATCH (e:Entity) WITH count(DISTINCT e) AS entities
            OPTIONAL MATCH (c:Claim) WITH entities, count(DISTINCT c) AS claims
            OPTIONAL MATCH (a:Artifact) WITH entities, claims, count(DISTINCT a) AS artifacts
            OPTIONAL MATCH (ev:Evidence) WITH entities, claims, artifacts, count(DISTINCT ev) AS evidence
            RETURN entities, claims, artifacts, evidence
            """
        )
        row = counts[0] if counts else {"entities": 0, "claims": 0, "artifacts": 0, "evidence": 0}

        merged_claims_rows = Database.read(
            """
            MATCH (c:Claim)-[:SUPPORTED_BY]->(ev:Evidence)-[:FROM_ARTIFACT]->(a:Artifact)
            WITH c, count(DISTINCT a) AS artifactCount
            WHERE artifactCount > 1
            RETURN count(c) AS mergedClaims
            """
        )
        merged_claims = merged_claims_rows[0]["mergedClaims"] if merged_claims_rows else 0

        most_connected = Database.read(
            """
            MATCH (e:Entity)-[:MADE_CLAIM]->(c:Claim)
            WITH e, count(c) AS degree
            RETURN e.name AS name, e.normalized_name AS id, degree
            ORDER BY degree DESC LIMIT 1
            """
        )

        recent_artifacts = Database.read(
            "MATCH (a:Artifact) RETURN a ORDER BY a.timestamp DESC LIMIT 8"
        )

        confidence_dist = Database.read(
            """
            MATCH (c:Claim)
            WITH CASE
                WHEN c.confidence >= 0.9 THEN '0.9-1.0'
                WHEN c.confidence >= 0.7 THEN '0.7-0.9'
                WHEN c.confidence >= 0.5 THEN '0.5-0.7'
                ELSE '0.0-0.5'
            END AS bucket
            RETURN bucket, count(*) AS count
            ORDER BY bucket
            """
        )

        claims_over_time = Database.read(
            """
            MATCH (a:Artifact)<-[:FROM_ARTIFACT]-(:Evidence)<-[:SUPPORTED_BY]-(c:Claim)
            WITH date(datetime(a.timestamp)) AS day, count(DISTINCT c) AS count
            RETURN toString(day) AS day, count
            ORDER BY day
            """
        )

        entity_growth = Database.read(
            """
            MATCH (a:Artifact)<-[:FROM_ARTIFACT]-(:Evidence)<-[:SUPPORTED_BY]-(c:Claim)<-[:MADE_CLAIM]-(e:Entity)
            WITH e, min(a.timestamp) AS firstSeen
            WITH date(datetime(firstSeen)) AS day, count(e) AS newEntities
            RETURN toString(day) AS day, newEntities
            ORDER BY day
            """
        )

        return {
            "total_entities": row["entities"],
            "total_claims": row["claims"],
            "total_artifacts": row["artifacts"],
            "total_evidence": row["evidence"],
            "canonical_entities": row["entities"],
            "duplicate_merges": merged_claims,
            "retrieval_questions_answered": _qa_counter["count"],
            "most_connected_entity": (
                {"name": most_connected[0]["name"], "id": most_connected[0]["id"], "degree": most_connected[0]["degree"]}
                if most_connected
                else None
            ),
            "recent_artifacts": [
                {**dict(r["a"]), "id": dict(r["a"]).get("artifact_id")} for r in recent_artifacts
            ],
            "charts": {
                "confidence_distribution": [dict(r) for r in confidence_dist],
                "claims_over_time": [dict(r) for r in claims_over_time],
                "entity_growth": [dict(r) for r in entity_growth],
            },
        }
