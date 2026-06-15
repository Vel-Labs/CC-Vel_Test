const THINKING_MESSAGES = [
  "checking skill shelf",
  "reading prompt shape",
  "keeping context lean",
  "asking Claude Sonnet",
  "matching skill metadata",
  "loading only what is needed",
  "checking guardrails",
  "preparing response"
];

const FRAMES = ["◜", "◠", "◝", "◞", "◡", "◟"];
const MIN_VISIBLE_MS = 300;

export async function withThinking<T>(work: Promise<T>, enabled = true, auditHint?: string): Promise<T> {
  if (!enabled) return work;

  let index = 0;
  const startedAt = Date.now();
  renderThinkingFrame(index, auditHint);
  const timer = setInterval(() => {
    index += 1;
    renderThinkingFrame(index, auditHint);
  }, 140);

  try {
    return await work;
  } finally {
    const elapsedMs = Date.now() - startedAt;
    if (elapsedMs < MIN_VISIBLE_MS) {
      await delay(MIN_VISIBLE_MS - elapsedMs);
    }
    clearInterval(timer);
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    clearThinkingLine();
    process.stdout.write(`✓ ready ${muted(`(${elapsed}s)`)}\n`);
  }
}

function renderThinkingFrame(index: number, auditHint?: string): void {
  const frame = FRAMES[index % FRAMES.length];
  const message = THINKING_MESSAGES[index % THINKING_MESSAGES.length];
  clearThinkingLine();
  process.stdout.write(`${accent(frame)} Vel Code ${muted("·")} ${message}...${auditHint ? muted(` ${auditHint}`) : ""}`);
}

function accent(value: string): string {
  return process.stdout.isTTY ? `\x1b[36m${value}\x1b[0m` : value;
}

function muted(value: string): string {
  return process.stdout.isTTY ? `\x1b[90m${value}\x1b[0m` : value;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clearThinkingLine(): void {
  process.stdout.write(process.stdout.isTTY ? "\r\x1b[2K" : `\r${" ".repeat(160)}\r`);
}
