from app.db import Database


class SearchService:
    @staticmethod
    def search(query, limit=8):
        entity_rows = Database.read(
            """
            MATCH (e:Entity)
            WHERE toLower(e.name) CONTAINS toLower($query)
               OR toLower(coalesce(e.email,'')) CONTAINS toLower($query)
               OR any(a IN e.aliases WHERE toLower(a) CONTAINS toLower($query))
            RETURN e LIMIT $limit
            """,
            query=query,
            limit=limit,
        )
        claim_rows = Database.read(
            """
            MATCH (c:Claim)
            WHERE toLower(c.subject) CONTAINS toLower($query)
               OR toLower(coalesce(c.object,'')) CONTAINS toLower($query)
            RETURN c LIMIT $limit
            """,
            query=query,
            limit=limit,
        )
        artifact_rows = Database.read(
            """
            MATCH (a:Artifact)
            WHERE toLower(coalesce(a.subject,'')) CONTAINS toLower($query)
               OR toLower(coalesce(a.sender,'')) CONTAINS toLower($query)
            RETURN a LIMIT $limit
            """,
            query=query,
            limit=limit,
        )

        entities = []
        for r in entity_rows:
            e = dict(r["e"])
            e["id"] = e.get("normalized_name")
            entities.append(e)

        claims = []
        for r in claim_rows:
            c = dict(r["c"])
            c["id"] = c.get("claim_id")
            c["is_current"] = c.get("valid_to") in (None, "None")
            claims.append(c)

        artifacts = []
        for r in artifact_rows:
            a = dict(r["a"])
            a["id"] = a.get("artifact_id")
            artifacts.append(a)

        return {"entities": entities, "claims": claims, "artifacts": artifacts}
