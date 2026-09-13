from app.db import Database


class ArtifactService:
    @staticmethod
    def list(search=None, skip=0, limit=25):
        where = []
        params = {"skip": skip, "limit": limit}
        if search:
            where.append(
                "(toLower(coalesce(a.subject,'')) CONTAINS toLower($search) OR toLower(coalesce(a.sender,'')) CONTAINS toLower($search))"
            )
            params["search"] = search
        where_clause = ("WHERE " + " AND ".join(where)) if where else ""
        rows = Database.read(
            f"""
            MATCH (a:Artifact)
            {where_clause}
            OPTIONAL MATCH (a)<-[:FROM_ARTIFACT]-(ev:Evidence)<-[:SUPPORTED_BY]-(c:Claim)
            WITH a, count(DISTINCT c) AS claimCount
            RETURN a, claimCount
            ORDER BY a.timestamp DESC
            SKIP $skip LIMIT $limit
            """,
            **params,
        )
        total = Database.read(
            f"MATCH (a:Artifact) {where_clause} RETURN count(a) AS total", **params
        )[0]["total"]
        items = []
        for r in rows:
            d = dict(r["a"])
            d["id"] = d.get("artifact_id")
            d["claim_count"] = r["claimCount"]
            items.append(d)
        return {"items": items, "total": total, "skip": skip, "limit": limit}

    @staticmethod
    def get(artifact_id):
        rows = Database.read(
            """
            MATCH (a:Artifact {artifact_id: $id})
            OPTIONAL MATCH (a)<-[:FROM_ARTIFACT]-(ev:Evidence)<-[:SUPPORTED_BY]-(c:Claim)
            OPTIONAL MATCH (s:Entity)-[:MADE_CLAIM]->(c)
            RETURN a,
                   collect(DISTINCT {claim: c, evidence: ev, subject: s}) AS rows
            """,
            id=artifact_id,
        )
        if not rows or rows[0]["a"] is None:
            return None
        r = rows[0]
        d = dict(r["a"])
        d["id"] = d.get("artifact_id")

        claims = {}
        spans = []
        entities = {}
        for row in r["rows"]:
            if row["claim"] is None:
                continue
            c = dict(row["claim"])
            cid = c.get("claim_id")
            if cid not in claims:
                c["id"] = cid
                c["is_current"] = c.get("valid_to") in (None, "None")
                claims[cid] = c
            if row["evidence"] is not None:
                ev = dict(row["evidence"])
                spans.append(
                    {
                        "claim_id": cid,
                        "claim_type": c.get("type"),
                        "quote": ev.get("quote"),
                        "char_start": ev.get("char_start"),
                        "char_end": ev.get("char_end"),
                    }
                )
            if row["subject"] is not None:
                s = dict(row["subject"])
                entities[s.get("normalized_name")] = {**s, "id": s.get("normalized_name")}

        d["claims"] = list(claims.values())
        d["evidence_spans"] = sorted(spans, key=lambda s: s["char_start"] or 0)
        d["entities"] = list(entities.values())
        return d
