import difflib
from collections import defaultdict

from app.db import Database


def _similarity(a, b):
    return difflib.SequenceMatcher(None, a, b).ratio()


class _UnionFind:
    def __init__(self, items):
        self.parent = {i: i for i in items}

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.parent[ra] = rb

    def groups(self):
        out = defaultdict(list)
        for i in self.parent:
            out[self.find(i)].append(i)
        return [g for g in out.values() if len(g) > 1]


class MergeService:
    ENTITY_SIMILARITY_THRESHOLD = 0.82
    CLAIM_SIMILARITY_THRESHOLD = 0.85

    @staticmethod
    def entity_duplicates():
        rows = Database.read("MATCH (e:Entity) RETURN e")
        entities = [dict(r["e"]) for r in rows]
        for e in entities:
            e["id"] = e.get("normalized_name")

        by_type = defaultdict(list)
        for e in entities:
            by_type[e.get("type")].append(e)

        groups = []
        for _type, ents in by_type.items():
            uf = _UnionFind([e["id"] for e in ents])
            for i in range(len(ents)):
                for j in range(i + 1, len(ents)):
                    a, b = ents[i], ents[j]
                    name_a, name_b = (a.get("name") or "").lower(), (b.get("name") or "").lower()
                    if not name_a or not name_b:
                        continue
                    sim = _similarity(name_a, name_b)
                    alias_hit = bool(
                        set((a.get("aliases") or [])) & set([b.get("name")] + (b.get("aliases") or []))
                    )
                    if sim >= MergeService.ENTITY_SIMILARITY_THRESHOLD or alias_hit:
                        uf.union(a["id"], b["id"])

            by_id = {e["id"]: e for e in ents}
            for cluster_ids in uf.groups():
                cluster = [by_id[i] for i in cluster_ids]
                canonical = max(
                    cluster, key=lambda e: (len(e.get("aliases") or []), len(e.get("name") or ""))
                )
                variants = [e for e in cluster if e["id"] != canonical["id"]]
                best_sim = max(
                    (_similarity((canonical.get("name") or "").lower(), (v.get("name") or "").lower()) for v in variants),
                    default=0.0,
                )
                alias_list = sorted(
                    {a for v in variants for a in (v.get("aliases") or [])} | set((canonical.get("aliases") or []))
                )
                groups.append(
                    {
                        "canonical": canonical,
                        "variants": variants,
                        "similarity": round(best_sim, 3),
                        "reason": (
                            f"Name similarity {round(best_sim * 100)}% via fuzzy match"
                            + (f" (aliases: {', '.join(alias_list)})" if alias_list else "")
                        ),
                    }
                )

        groups.sort(key=lambda g: g["similarity"], reverse=True)
        return {"groups": groups}

    @staticmethod
    def claim_duplicates():
        merged_rows = Database.read(
            """
            MATCH (c:Claim)-[:SUPPORTED_BY]->(ev:Evidence)-[:FROM_ARTIFACT]->(a:Artifact)
            WITH c, count(DISTINCT ev) AS evidenceCount, count(DISTINCT a) AS artifactCount
            WHERE artifactCount > 1
            RETURN c, evidenceCount, artifactCount
            ORDER BY artifactCount DESC
            LIMIT 100
            """
        )
        merged_groups = []
        for r in merged_rows:
            c = dict(r["c"])
            c["id"] = c.get("claim_id")
            c["is_current"] = c.get("valid_to") in (None, "None")
            merged_groups.append(
                {
                    "claim": c,
                    "evidence_count": r["evidenceCount"],
                    "distinct_artifacts": r["artifactCount"],
                    "reason": (
                        f"Merged at ingestion: identical (type, subject, object, event_time) key, "
                        f"{r['artifactCount']} independent extractions"
                    ),
                }
            )

        recent_rows = Database.read(
            """
            MATCH (c:Claim)
            RETURN c
            ORDER BY coalesce(c.event_time, c.valid_from) DESC
            LIMIT 500
            """
        )
        claims = [dict(r["c"]) for r in recent_rows]
        for c in claims:
            c["id"] = c.get("claim_id")
            c["is_current"] = c.get("valid_to") in (None, "None")

        by_type = defaultdict(list)
        for c in claims:
            by_type[c.get("type")].append(c)

        near_duplicate_groups = []
        for _type, group_claims in by_type.items():
            uf = _UnionFind([c["claim_id"] for c in group_claims])
            for i in range(len(group_claims)):
                for j in range(i + 1, len(group_claims)):
                    a, b = group_claims[i], group_claims[j]
                    if a["claim_id"] == b["claim_id"]:
                        continue
                    text_a = f"{a.get('subject') or ''} {a.get('object') or ''}".lower()
                    text_b = f"{b.get('subject') or ''} {b.get('object') or ''}".lower()
                    sim = _similarity(text_a, text_b)
                    if sim >= MergeService.CLAIM_SIMILARITY_THRESHOLD:
                        uf.union(a["claim_id"], b["claim_id"])

            by_id = {c["claim_id"]: c for c in group_claims}
            for cluster_ids in uf.groups():
                cluster = [by_id[i] for i in cluster_ids]
                sims = []
                for i in range(len(cluster)):
                    for j in range(i + 1, len(cluster)):
                        text_a = f"{cluster[i].get('subject') or ''} {cluster[i].get('object') or ''}".lower()
                        text_b = f"{cluster[j].get('subject') or ''} {cluster[j].get('object') or ''}".lower()
                        sims.append(_similarity(text_a, text_b))
                avg_sim = round(sum(sims) / len(sims), 3) if sims else 0.0
                near_duplicate_groups.append(
                    {
                        "claims": cluster,
                        "similarity": avg_sim,
                        "reason": (
                            f"{len(cluster)} claims of type {_type} describe near-identical statements "
                            f"({round(avg_sim * 100)}% text similarity) but were not auto-merged because "
                            "their (subject, object, event_time) keys differ slightly."
                        ),
                    }
                )

        near_duplicate_groups.sort(key=lambda g: g["similarity"], reverse=True)
        return {"merged_groups": merged_groups, "near_duplicate_groups": near_duplicate_groups}
