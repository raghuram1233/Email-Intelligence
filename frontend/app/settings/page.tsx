"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2, RefreshCw, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStats } from "@/lib/hooks";
import { ApiError } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function ConnectionStatus() {
  const { data, isLoading, isError, error, refetch, isFetching } = useStats();

  let badge: React.ReactNode;
  if (isLoading) {
    badge = <Badge variant="muted">Checking…</Badge>;
  } else if (isError) {
    const apiError = error instanceof ApiError ? error : null;
    if (apiError?.status === 0) {
      badge = (
        <Badge variant="danger">
          <XCircle className="h-3 w-3" /> Unreachable
        </Badge>
      );
    } else {
      badge = (
        <Badge variant="warning">
          <AlertTriangle className="h-3 w-3" /> Backend reachable, database unavailable
        </Badge>
      );
    }
  } else if (data) {
    badge = (
      <Badge variant="success">
        <CheckCircle2 className="h-3 w-3" /> Connected
      </Badge>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-elevated/40 px-4 py-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted">API endpoint</div>
            <div className="mt-0.5 font-mono text-sm text-foreground">{API_URL}</div>
          </div>
          {badge}
        </div>
        {isError && !(error instanceof ApiError && error.status === 0) && (
          <p className="text-xs text-muted">
            {(error as ApiError)?.message ??
              "The API is reachable but returned an error — Neo4j may not be running."}
          </p>
        )}
        <Button size="sm" variant="secondary" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Recheck
        </Button>
      </CardContent>
    </Card>
  );
}

function About() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About Layer10</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted">
        <p>
          Layer10 is a grounded long-term organizational memory system built over the Enron email
          corpus. An extraction pipeline reads raw emails, uses an LLM to pull out structured entities
          and claims, canonicalizes and deduplicates them, and stores the results — together with the
          exact evidence spans that support each claim — in a Neo4j graph. Every fact surfaced in this
          UI can be traced back to the original email text it came from.
        </p>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-elevated/40 px-4 py-3 text-xs">
          <Badge variant="accent">Next.js frontend</Badge>
          <ArrowRight className="h-3.5 w-3.5 text-muted" />
          <Badge variant="default">FastAPI backend</Badge>
          <ArrowRight className="h-3.5 w-3.5 text-muted" />
          <Badge variant="success">Neo4j graph database</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function DataModel() {
  const nodes = [
    { label: "Entity", desc: "People, organizations, projects, topics, locations", color: "#6366F1" },
    { label: "Claim", desc: "A canonical statement (role, decision, ownership, ...)", color: "#94a3b8" },
    { label: "Evidence", desc: "An exact supporting quote with character offsets", color: "#06B6D4" },
    { label: "Artifact", desc: "The source email a claim was extracted from", color: "#10B981" },
  ];
  const edges = ["MADE_CLAIM", "SUPPORTED_BY", "FROM_ARTIFACT"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Model</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          {nodes.map((n, i) => (
            <div key={n.label} className="flex shrink-0 items-center gap-2">
              <span
                className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                style={{ borderColor: `${n.color}55`, backgroundColor: `${n.color}1a`, color: n.color }}
              >
                {n.label}
              </span>
              {i < edges.length && (
                <span className="flex items-center gap-1 text-[10px] text-muted">
                  <ArrowRight className="h-3 w-3" />
                  {edges[i]}
                </span>
              )}
            </div>
          ))}
        </div>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {nodes.map((n) => (
            <div key={n.label} className="rounded-xl border border-white/10 bg-elevated/30 px-3 py-2">
              <dt className="text-xs font-semibold" style={{ color: n.color }}>
                {n.label}
              </dt>
              <dd className="mt-0.5 text-xs text-muted">{n.desc}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted">Connection status and a quick reference for how Layer10 is put together.</p>
      </div>
      <ConnectionStatus />
      <About />
      <DataModel />
    </div>
  );
}
