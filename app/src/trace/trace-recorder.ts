export class TraceRecorder {
  private lines: string[] = [];

  add(label: string, value?: string | number | boolean | null): void {
    if (value === undefined) {
      this.lines.push(label);
      return;
    }
    this.lines.push(`${label}: ${value === null ? "none" : String(value)}`);
  }

  section(title: string): void {
    this.lines.push("");
    this.lines.push(title);
    this.lines.push("-".repeat(Math.max(12, title.length)));
  }

  toString(): string {
    const body = this.lines.filter((line, index) => !(index === 0 && line === "")).join("\n");
    return [
      "────────────────────────────────────────",
      "Skill Trace",
      "────────────────────────────────────────",
      body.trim()
    ].filter(Boolean).join("\n");
  }
}
