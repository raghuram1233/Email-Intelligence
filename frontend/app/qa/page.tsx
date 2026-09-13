"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, CornerDownLeft, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EvidenceCard } from "@/components/qa/evidence-card";
import { useAskQuestion } from "@/lib/hooks";
import { claimTypeLabel, confidenceColor, confidenceLabel, entityTypeColor, truncate } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import type { QaResponse } from "@/lib/types";

const EXAMPLE_QUESTIONS = [
  "Who owns Project Atlas?",
  "What decisions were made about trading?",
  "When was the infrastructure migration discussed?",
  "What commitments were made regarding the budget?",
];

interface Message {
  id: string;
  question: string;
  response: QaResponse | null;
  error: string | null;
  loading: boolean;
}

let messageCounter = 0;
function nextId() {
  messageCounter += 1;
  return `msg-${messageCounter}`;
}

export default function QaPage() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const mutation = useAskQuestion();
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function submit(question: string) {
    const trimmed = question.trim();
    if (!trimmed || mutation.isPending) return;
    const id = nextId();
    setMessages((prev) => [...prev, { id, question: trimmed, response: null, error: null, loading: true }]);
    setInput("");

    try {
      const response = await mutation.mutateAsync(trimmed);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, response, loading: false } : m))
      );
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 0
            ? "Couldn't reach the retrieval pipeline — check that the backend is running."
            : err.message
          : "Something went wrong answering that question.";
      setMessages((prev) => (prev.map((m) => (m.id === id ? { ...m, error: message, loading: false } : m))));
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(input);
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto pb-4">
        {isEmpty && (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Ask the memory graph</h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
                Ask a grounded question about the memory graph — every answer is backed by real
                evidence from the underlying emails.
              </p>
            </div>
            <div className="flex max-w-lg flex-wrap justify-center gap-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => submit(q)}
                  className="rounded-full border border-white/10 bg-elevated/50 px-3 py-1.5 text-xs text-muted transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary/15 px-4 py-2.5 text-sm text-foreground">
                {m.question}
              </div>
            </div>

            {m.loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-sm text-muted"
              >
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
                </span>
                Searching the memory graph...
              </motion.div>
            )}

            {m.error && (
              <Card className="border-danger/30 bg-danger/5 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-danger">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {m.error}
                </div>
              </Card>
            )}

            {m.response && (
              <Card className="max-w-3xl space-y-4 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm leading-relaxed text-foreground">{m.response.answer}</p>
                  <span
                    className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      color: confidenceColor(m.response.confidence),
                      borderColor: confidenceColor(m.response.confidence),
                    }}
                  >
                    {confidenceLabel(m.response.confidence)}
                  </span>
                </div>

                {m.response.evidence.length === 0 || m.response.confidence === 0 ? (
                  <p className="rounded-xl border border-white/10 bg-elevated/40 px-3 py-2 text-xs text-muted">
                    No grounded evidence was found for this question.
                  </p>
                ) : (
                  <>
                    {(m.response.linked_entities.length > 0 || m.response.linked_claims.length > 0) && (
                      <div className="flex flex-wrap gap-1.5">
                        {m.response.linked_entities.map((e) => (
                          <Link key={e.id} href={`/entities/${encodeURIComponent(e.id)}`}>
                            <Badge
                              variant="muted"
                              style={{ color: entityTypeColor(e.type) }}
                              className="hover:opacity-80"
                            >
                              {e.name}
                            </Badge>
                          </Link>
                        ))}
                        {m.response.linked_claims.map((c) => (
                          <Link key={c.id} href={`/claims/${encodeURIComponent(c.id)}`}>
                            <Badge variant="default" className="hover:opacity-80">
                              {claimTypeLabel(c.type)}: {truncate(c.subject, 24)}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    )}

                    <div>
                      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                        Evidence pack ({m.response.evidence.length})
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {m.response.evidence.map((ev, i) => (
                          <EvidenceCard key={`${ev.claim_id}-${i}`} evidence={ev} />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </Card>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="flex shrink-0 items-center gap-2 border-t border-white/10 pt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the memory graph..."
          disabled={mutation.isPending}
          className="flex-1"
        />
        <Button type="submit" disabled={mutation.isPending || !input.trim()}>
          Send
          <CornerDownLeft className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
