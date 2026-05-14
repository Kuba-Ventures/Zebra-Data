// Static metadata about which connectors have a real implementation registered.
// Kept in a separate file (no server-only imports) so it's safe to import
// from client components like SourceCard.

export const CONNECTOR_IDS = new Set<string>([
  "whoop",
  "oura",
  "mychart", // mock but uses real OAuth flow shape
]);
