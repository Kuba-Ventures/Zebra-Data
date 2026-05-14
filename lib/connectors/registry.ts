import "server-only";
import type { Connector } from "./types";
import { whoopConnector } from "./whoop";
import { ouraConnector } from "./oura";
import { mychartConnector } from "./mychart";
import { genericMockConnector } from "./mock";

let _registry: Record<string, Connector> | null = null;

export function getRegistry(): Record<string, Connector> {
  if (_registry) return _registry;
  _registry = {
    whoop: whoopConnector,
    oura: ouraConnector,
    mychart: mychartConnector,
  };
  return _registry;
}

/** Resolve a connector for a stored source_id (e.g. 'mychart:vcu' → mychart). */
export function resolveConnectorBySourceId(sourceId: string): Connector {
  const base = sourceId.split(":")[0];
  const c = getRegistry()[base];
  if (c) return c;
  // Fallback: generic mock keyed off the catalog id.
  return genericMockConnector(base);
}
