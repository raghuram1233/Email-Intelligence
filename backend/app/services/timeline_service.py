from app.db import Database


class TimelineService:
    @staticmethod
    def timeline(entity=None, claim_type=None, min_confidence=None, limit=200):
        params = {"limit": limit}
        where = []
        if entity:
            where.append("toLower(e.name) CONTAINS toLower($entity)")
            params["entity"] = entity
        if claim_type:
            where.append("c.type = $claim_type")
            params["claim_type"] = claim_type
        if min_confidence is not None:
            where.append("c.confidence >= $min_confidence")
            params["min_confidence"] = min_confidence
        where_clause = ("WHERE " + " AND ".join(where)) if where else ""

        claim_events = Database.read(
            f"""
            MATCH (e:Entity)-[:MADE_CLAIM]->(c:Claim)
            {where_clause}
            OPTIONAL MATCH (c)-[:SUPPORTED_BY]->(:Evidence)-[:FROM_ARTIFACT]->(a:Artifact)
            RETURN DISTINCT e.name AS entity, e.normalized_name AS entity_id, c, a.artifact_id AS artifact_id
            ORDER BY coalesce(c.event_time, c.valid_from) ASC
            LIMIT $limit
            """,
            **params,
        )

        events = []
        for r in claim_events:
            c = dict(r["c"])
            events.append(
                {
                    "event_type": "claim_superseded" if c.get("valid_to") not in (None, "None") else "claim_observed",
                    "timestamp": c.get("event_time") or c.get("valid_from"),
                    "entity": r["entity"],
                    "entity_id": r["entity_id"],
                    "claim_id": c.get("claim_id"),
                    "claim_type": c.get("type"),
                    "subject": c.get("subject"),
                    "object": c.get("object"),
                    "confidence": c.get("confidence"),
                    "artifact_id": r["artifact_id"],
                }
            )

        artifact_events = Database.read(
            "MATCH (a:Artifact) RETURN a ORDER BY a.timestamp ASC LIMIT $limit", limit=limit
        )
        for r in artifact_events:
            a = dict(r["a"])
            events.append(
                {
                    "event_type": "artifact_ingested",
                    "timestamp": a.get("timestamp"),
                    "entity": a.get("sender"),
                    "entity_id": None,
                    "claim_id": None,
                    "claim_type": None,
                    "subject": a.get("subject"),
                    "object": None,
                    "confidence": None,
                    "artifact_id": a.get("artifact_id"),
                }
            )

        events.sort(key=lambda e: e["timestamp"] or "")
        return events[:limit]
