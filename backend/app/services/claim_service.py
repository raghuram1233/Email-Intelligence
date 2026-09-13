from app.db import Database


def _claim_to_dict(node, evidence_count=None):
    d = dict(node)
    d["id"] = d.get("claim_id")
    d["is_current"] = d.get("valid_to") in (None, "None")
    if evidence_count is not None:
        d["evidence_count"] = evidence_count
    return d


class ClaimService:
    @staticmethod
    def list(search=None, type=None, current=None, min_confidence=None, skip=0, limit=25):
        where = []
        params = {"skip": skip, "limit": limit}
        if search:
            where.append(
                "(toLower(c.subject) CONTAINS toLower($search) OR toLower(coalesce(c.object,'')) CONTAINS toLower($search))"
            )
            params["search"] = search
        if type:
            where.append("c.type = $type")
            params["type"] = type
        if current is not None:
            if current:
                where.append("(c.valid_to IS NULL OR c.valid_to = 'None')")
            else:
                where.append("NOT (c.valid_to IS NULL OR c.valid_to = 'None')")
        if min_confidence is not None:
            where.append("c.confidence >= $min_confidence")
            params["min_confidence"] = min_confidence
        where_clause = ("WHERE " + " AND ".join(where)) if where else ""

        rows = Database.read(
            f"""
            MATCH (c:Claim)
            {where_clause}
            OPTIONAL MATCH (c)-[:SUPPORTED_BY]->(ev:Evidence)
            WITH c, count(ev) AS evidenceCount
            RETURN c, evidenceCount
            ORDER BY coalesce(c.event_time, c.valid_from) DESC
            SKIP $skip LIMIT $limit
            """,
            **params,
        )
        total = Database.read(
            f"MATCH (c:Claim) {where_clause} RETURN count(c) AS total", **params
        )[0]["total"]
        items = [_claim_to_dict(r["c"], r["evidenceCount"]) for r in rows]
        return {"items": items, "total": total, "skip": skip, "limit": limit}

    @staticmethod
    def get(claim_id):
        rows = Database.read(
            """
            MATCH (c:Claim {claim_id: $id})
            OPTIONAL MATCH (s:Entity)-[:MADE_CLAIM]->(c)
            OPTIONAL MATCH (c)-[:SUPPORTED_BY]->(ev:Evidence)-[:FROM_ARTIFACT]->(a:Artifact)
            RETURN c, s,
                   collect(DISTINCT {evidence: ev, artifact: a}) AS evidence
            """,
            id=claim_id,
        )
        if not rows or rows[0]["c"] is None:
            return None
        r = rows[0]
        d = _claim_to_dict(r["c"])
        d["subject_entity"] = dict(r["s"]) if r["s"] else None
        if d["subject_entity"] is not None:
            d["subject_entity"]["id"] = d["subject_entity"].get("normalized_name")
        evidence_items = []
        for e in r["evidence"]:
            if e["evidence"] is None:
                continue
            ev = dict(e["evidence"])
            art = dict(e["artifact"]) if e["artifact"] else {}
            evidence_items.append(
                {
                    "evidence_id": ev.get("evidence_id"),
                    "quote": ev.get("quote"),
                    "char_start": ev.get("char_start"),
                    "char_end": ev.get("char_end"),
                    "message_id": ev.get("message_id"),
                    "extracted_at": str(ev.get("extracted_at")) if ev.get("extracted_at") else None,
                    "artifact_id": art.get("artifact_id"),
                    "artifact_subject": art.get("subject"),
                    "artifact_sender": art.get("sender"),
                    "artifact_timestamp": art.get("timestamp"),
                }
            )
        d["evidence"] = evidence_items
        d["evidence_count"] = len(evidence_items)
        d["distinct_artifacts"] = len({e["artifact_id"] for e in evidence_items if e["artifact_id"]})
        d["merge_explanation"] = (
            f"This canonical claim aggregates {len(evidence_items)} supporting evidence "
            f"excerpt(s) from {d['distinct_artifacts']} distinct artifact(s). Claims sharing the same "
            "(type, subject, object, event_time) key are merged into one canonical claim at ingestion "
            "(see deduper.deduplicate_claims), keeping the highest observed confidence."
            if evidence_items
            else "No supporting evidence recorded for this claim."
        )
        return d
