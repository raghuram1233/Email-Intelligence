const CLAIM_TYPE_COLORS: Record<string, string> = {
  RoleAssignment: "#6366F1",
  Decision: "#06B6D4",
  Intent: "#F59E0B",
  Commitment: "#10B981",
  Ownership: "#818CF8",
  FinancialStatement: "#EF4444",
  MeetingPlan: "#22D3EE",
  Misc: "#94A3B8",
};

export function claimTypeColor(type: string | null | undefined): string {
  if (!type) return "#94A3B8";
  return CLAIM_TYPE_COLORS[type] ?? "#94A3B8";
}
