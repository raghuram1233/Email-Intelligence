import re

from app.db import Database
from app.services.stats_service import increment_qa_counter

STOPWORDS = {
    "who", "what", "when", "where", "why",
    "how", "is", "was", "the", "a", "an",
    "did", "to", "of", "in", "on", "were", "are",
    "does", "do", "with", "for", "and", "or",
}


def extract_keywords(question):
    tokens = re.findall(r"\b\w+\b", question.lower())
    return [t for t in tokens if t not in STOPWORDS and len(t) > 2]


def _phrase(claim_type):
    return {
        "RoleAssignment": "was assigned the role related to",
        "Decision": "made a decision regarding",
        "Intent": "expressed intent regarding",
        "Commitment": "committed to",
        "Ownership": "owns",
        "FinancialStatement": "made a financial statement about",
        "MeetingPlan": "planned a meeting about",
        "Misc": "made a statement about",
    }.get(claim_type, "made a claim about")


class RetrievalService:
    @staticmethod
    def search_claims(keywords, limit=8):
        query = """
        MATCH (s:Entity)-[:MADE_CLAIM]->(c:Claim)-[:SUPPORTED_BY]->(ev:Evidence)-[:FROM_ARTIFACT]->(a:Artifact)

        WITH s, c, ev, a,
        (
            CASE WHEN ANY(k IN $keywords WHERE toLower(c.subject) CONTAINS k) THEN 2 ELSE 0 END +
            CASE WHEN ANY(k IN $keywords WHERE toLower(coalesce(c.object,'')) CONTAINS k) THEN 3 ELSE 0 END +
            CASE WHEN ANY(k IN $keywords WHERE toLower(ev.quote) CONTAINS k) THEN 2 ELSE 0 END +
            CASE WHEN ANY(k IN $keywords WHERE toLower(coalesce(a.subject,'')) CONTAINS k) THEN 1 ELSE 0 END
        ) AS score

        WHERE score > 0

        RETURN s, c, ev, a, score
        ORDER BY score DESC
        LIMIT $limit
        """
        rows = Database.read(query, keywords=keywords, limit=limit)
        matches = []
        for r in rows:
            s, c, ev, a = dict(r["s"]), dict(r["c"]), dict(r["ev"]), dict(r["a"])
            matches.append(
                {
                    "subject_entity": {**s, "id": s.get("normalized_name")},
                    "claim": {**c, "id": c.get("claim_id"), "is_current": c.get("valid_to") in (None, "None")},
                    "quote": ev.get("quote"),
                    "artifact_id": a.get("artifact_id"),
                    "artifact_subject": a.get("subject"),
                    "artifact_sender": a.get("sender"),
                    "artifact_timestamp": a.get("timestamp"),
                    "score": r["score"],
                }
            )
        return matches

    @staticmethod
    def answer(question):
        keywords = extract_keywords(question)
        matches = RetrievalService.search_claims(keywords) if keywords else []

        if not matches:
            answer_text = "No grounded evidence was found for this question in the memory graph."
            confidence = 0.0
        else:
            top = matches[0]
            claim = top["claim"]
            subject = claim.get("subject") or top["subject_entity"].get("name")
            object_ = claim.get("object")
            phrase = _phrase(claim.get("type"))
            tail = f" {object_}" if object_ else ""
            n_evidence = len({(m["artifact_id"], m["claim"]["id"]) for m in matches if m["claim"]["id"] == claim["id"]})
            answer_text = (
                f"{subject} {phrase}{tail}, based on {max(n_evidence, 1)} supporting evidence excerpt(s)."
            )
            confidence = float(claim.get("confidence") or 0.0)

        linked_entities = {}
        linked_claims = {}
        evidence = []
        for m in matches:
            e = m["subject_entity"]
            linked_entities[e["id"]] = e
            c = m["claim"]
            linked_claims[c["id"]] = c
            evidence.append(
                {
                    "quote": m["quote"],
                    "artifact_id": m["artifact_id"],
                    "artifact_subject": m["artifact_subject"],
                    "artifact_sender": m["artifact_sender"],
                    "artifact_timestamp": m["artifact_timestamp"],
                    "relevance_score": m["score"],
                    "claim_id": c["id"],
                }
            )

        increment_qa_counter()

        return {
            "question": question,
            "keywords": keywords,
            "answer": answer_text,
            "confidence": confidence,
            "linked_entities": list(linked_entities.values()),
            "linked_claims": list(linked_claims.values()),
            "evidence": evidence,
        }
