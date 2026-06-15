import { appendText } from "../lib/fs.js";
import { usageLedgerPath } from "../lib/paths.js";
import { sha256Short, truncate } from "../lib/text.js";

export interface LedgerEvent {
  type: string;
  prompt?: string;
  skillName?: string | null;
  details?: Record<string, unknown>;
}

export async function recordUsage(repoRoot: string, event: LedgerEvent): Promise<void> {
  if (process.env.MINI_AGENT_DISABLE_LEDGER === "1") return;
  const record = {
    timestamp: new Date().toISOString(),
    type: event.type,
    skillName: event.skillName ?? undefined,
    promptPreview: event.prompt ? truncate(event.prompt, 160) : undefined,
    promptHash: event.prompt ? sha256Short(event.prompt) : undefined,
    details: event.details ?? {}
  };
  await appendText(usageLedgerPath(repoRoot), `${JSON.stringify(record)}\n`);
}
