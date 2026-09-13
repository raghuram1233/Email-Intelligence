from app.db import Database


def _entity_to_dict(node, degree=None):
    d = dict(node)
    d["id"] = d.get("normalized_name")
    if degree is not None:
        d["degree"] = degree
    return d


class EntityService:
    @staticmethod
    def list(search=None, type=None, skip=0, limit=25, sort="name"):
        where = []
        params = {"skip": skip, "limit": limit}
        if search:
            where.append(
                "(toLower(e.name) CONTAINS toLower($search) OR toLower(e.email) CONTAINS toLower($search) "
                "OR any(a IN e.aliases WHERE toLower(a) CONTAINS toLower($search)))"
            )
            params["search"] = search
        if type:
            where.append("e.type = $type")
            params["type"] = type
        where_clause = ("WHERE " + " AND ".join(where)) if where else ""
        sort_field = {"name": "e.name", "type": "e.type"}.get(sort, "e.name")

        rows = Database.read(
            f"""
            MATCH (e:Entity)
            {where_clause}
            OPTIONAL MATCH (e)-[:MADE_CLAIM]->(c:Claim)
            WITH e, count(c) AS claimCount
            RETURN e, claimCount
            ORDER BY {sort_field}
            SKIP $skip LIMIT $limit
            """,
            **params,
        )
        total = Database.read(
            f"MATCH (e:Entity) {where_clause} RETURN count(e) AS total", **params
        )[0]["total"]

        items = []
        for r in rows:
            d = _entity_to_dict(r["e"])
            d["claim_count"] = r["claimCount"]
            items.append(d)
        return {"items": items, "total": total, "skip": skip, "limit": limit}

    @staticmethod
    def get(entity_id):
        rows = Database.read(
            """
            MATCH (e:Entity {normalized_name: $id})
            OPTIONAL MATCH (e)-[:MADE_CLAIM]->(c:Claim)
            OPTIONAL MATCH (c)-[:SUPPORTED_BY]->(ev:Evidence)
            RETURN e,
                   count(DISTINCT c) AS claimCount,
                   count(DISTINCT ev) AS evidenceCount,
                   min(coalesce(c.event_time, c.valid_from)) AS firstSeen,
                   max(coalesce(c.event_time, c.valid_from)) AS lastSeen
            """,
            id=entity_id,
        )
        if not rows or rows[0]["e"] is None:
            return None
        r = rows[0]
        d = _entity_to_dict(r["e"])
        d["claim_count"] = r["claimCount"]
        d["evidence_count"] = r["evidenceCount"]
        d["first_seen"] = r["firstSeen"]
        d["last_seen"] = r["lastSeen"]
        return d

    @staticmethod
    def claims(entity_id, skip=0, limit=25):
        rows = Database.read(
            """
            MATCH (e:Entity {normalized_name: $id})-[:MADE_CLAIM]->(c:Claim)
            OPTIONAL MATCH (c)-[:SUPPORTED_BY]->(ev:Evidence)
            WITH c, count(ev) AS evidenceCount
            RETURN c, evidenceCount
            ORDER BY coalesce(c.event_time, c.valid_from) DESC
            SKIP $skip LIMIT $limit
            """,
            id=entity_id,
            skip=skip,
            limit=limit,
        )
        items = []
        for r in rows:
            c = dict(r["c"])
            c["id"] = c.get("claim_id")
            c["evidence_count"] = r["evidenceCount"]
            c["is_current"] = c.get("valid_to") in (None, "None")
            items.append(c)
        return items

    @staticmethod
    def relationships(entity_id):
        """Entities connected via shared claims: this entity made a claim whose
        object text matches another entity's name/aliases (best-effort inference
        from the free-text `object` field — there is no explicit entity-entity
        edge in the schema)."""
        rows = Database.read(
            """
            MATCH (e:Entity {normalized_name: $id})-[:MADE_CLAIM]->(c:Claim)
            MATCH (other:Entity)
            WHERE other.normalized_name <> $id
              AND c.object IS NOT NULL
              AND toLower(other.name) = toLower(c.object)
            RETURN DISTINCT other, c.type AS via_claim_type, c.claim_id AS claim_id
            LIMIT 50
            """,
            id=entity_id,
        )
        return [
            {
                "entity": _entity_to_dict(r["other"]),
                "via_claim_type": r["via_claim_type"],
                "claim_id": r["claim_id"],
            }
            for r in rows
        ]

    @staticmethod
    def timeline(entity_id):
        rows = Database.read(
            """
            MATCH (e:Entity {normalized_name: $id})-[:MADE_CLAIM]->(c:Claim)
            OPTIONAL MATCH (c)-[:SUPPORTED_BY]->(ev:Evidence)-[:FROM_ARTIFACT]->(a:Artifact)
            RETURN c, collect(DISTINCT a) AS artifacts
            ORDER BY coalesce(c.event_time, c.valid_from) ASC
            """,
            id=entity_id,
        )
        events = []
        for r in rows:
            c = dict(r["c"])
            for a in r["artifacts"]:
                events.append(
                    {
                        "type": "claim",
                        "timestamp": c.get("event_time") or c.get("valid_from"),
                        "claim_type": c.get("type"),
                        "claim_id": c.get("claim_id"),
                        "subject": c.get("subject"),
                        "object": c.get("object"),
                        "confidence": c.get("confidence"),
                        "artifact_id": dict(a).get("artifact_id"),
                        "artifact_subject": dict(a).get("subject"),
                    }
                )
        return events
