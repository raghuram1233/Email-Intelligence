from app.db import Database

TYPE_COLORS = {
    "Person": "#6366F1",
    "Organization": "#06B6D4",
    "Project": "#10B981",
    "Topic": "#F59E0B",
    "Location": "#EF4444",
}


class GraphService:
    @staticmethod
    def graph(entity_type=None, min_confidence=None, limit=300):
        params = {"limit": limit}
        conditions = []
        if entity_type:
            conditions.append("e.type = $entity_type")
            params["entity_type"] = entity_type
        if min_confidence is not None:
            conditions.append("c.confidence >= $min_confidence")
            params["min_confidence"] = min_confidence
        where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""

        rows = Database.read(
            f"""
            MATCH (e:Entity)-[:MADE_CLAIM]->(c:Claim)
            {where_clause}
            WITH e, c
            LIMIT $limit
            OPTIONAL MATCH (other:Entity)
            WHERE c.object IS NOT NULL AND toLower(other.name) = toLower(c.object)
            RETURN e, c, other
            """,
            **params,
        )

        nodes = {}
        edges = []
        for r in rows:
            e = dict(r["e"])
            eid = f"entity:{e.get('normalized_name')}"
            if eid not in nodes:
                nodes[eid] = {
                    "id": eid,
                    "type": "entity",
                    "entity_type": e.get("type"),
                    "label": e.get("name"),
                    "color": TYPE_COLORS.get(e.get("type"), "#6366F1"),
                    "raw_id": e.get("normalized_name"),
                }
            c = dict(r["c"])
            cid = f"claim:{c.get('claim_id')}"
            if cid not in nodes:
                nodes[cid] = {
                    "id": cid,
                    "type": "claim",
                    "claim_type": c.get("type"),
                    "label": c.get("type"),
                    "color": "#94a3b8",
                    "confidence": c.get("confidence"),
                    "raw_id": c.get("claim_id"),
                }
            edges.append(
                {
                    "id": f"{eid}->{cid}",
                    "source": eid,
                    "target": cid,
                    "label": "MADE_CLAIM",
                }
            )
            if r["other"] is not None:
                other = dict(r["other"])
                oid = f"entity:{other.get('normalized_name')}"
                if oid not in nodes:
                    nodes[oid] = {
                        "id": oid,
                        "type": "entity",
                        "entity_type": other.get("type"),
                        "label": other.get("name"),
                        "color": TYPE_COLORS.get(other.get("type"), "#6366F1"),
                        "raw_id": other.get("normalized_name"),
                    }
                edges.append(
                    {
                        "id": f"{cid}->{oid}",
                        "source": cid,
                        "target": oid,
                        "label": c.get("type"),
                    }
                )

        return {"nodes": list(nodes.values()), "edges": edges}
