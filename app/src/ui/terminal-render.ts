export function renderTerminalResponse(text: string): string {
  const lines = text.split("\n");
  const rendered: string[] = [];
  let inCodeFence = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.trim().startsWith("```")) {
      inCodeFence = !inCodeFence;
      if (inCodeFence) rendered.push("  " + "─".repeat(34));
      else rendered.push("  " + "─".repeat(34));
      continue;
    }

    if (inCodeFence) {
      rendered.push(`  ${line}`);
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const title = stripInlineMarkdown(heading[2]).toUpperCase();
      if (rendered.length > 0 && rendered[rendered.length - 1] !== "") rendered.push("");
      rendered.push(title);
      rendered.push("─".repeat(Math.min(48, Math.max(12, title.length))));
      continue;
    }

    const numbered = /^(\d+)\.\s+\*\*(.+?)\*\*\s*[-–—:]?\s*(.*)$/.exec(line);
    if (numbered) {
      rendered.push(`${numbered[1]}. ${stripInlineMarkdown(numbered[2])}${numbered[3] ? ` - ${stripInlineMarkdown(numbered[3])}` : ""}`);
      continue;
    }

    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      rendered.push(`  - ${stripInlineMarkdown(bullet[1])}`);
      continue;
    }

    rendered.push(stripInlineMarkdown(line));
  }

  return rendered.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function renderPanel(title: string, body: string): string {
  const contentWidth = 70;
  const topLabel = `─ ${title} `;
  const top = `┌${topLabel}${"─".repeat(Math.max(0, contentWidth + 2 - topLabel.length))}┐`;
  const bottom = `└${"─".repeat(contentWidth + 2)}┘`;
  const bodyLines = body
    .split("\n")
    .flatMap((line) => wrapPanelLine(line, contentWidth))
    .map((line) => `│ ${line.padEnd(contentWidth, " ")} │`);

  return [top, ...bodyLines, bottom].join("\n");
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)");
}

function wrapPanelLine(line: string, width: number): string[] {
  if (line.length <= width) return [line];

  const wrapped: string[] = [];
  let remaining = line;
  while (remaining.length > width) {
    const breakAt = remaining.lastIndexOf(" ", width);
    const sliceAt = breakAt > 16 ? breakAt : width;
    wrapped.push(remaining.slice(0, sliceAt).trimEnd());
    remaining = remaining.slice(sliceAt).trimStart();
  }
  wrapped.push(remaining);
  return wrapped;
}
