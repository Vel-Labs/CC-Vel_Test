export function renderVelCodeBanner(): string {
  return [
    " __      ______",
    " \\ \\    / / ___|   Vel Code",
    "  \\ \\  / / |       Agent Skills CLI",
    "   \\ \\/ /| |___",
    "    \\__/  \\____|",
    "",
    "Type a prompt to chat. Commands: /help, /trace, /paste, /demo, /exit",
    "",
    "Suggested prompts (enter 1, 2, or 3):",
    "  1. Required welcome    | I'm new to this project, what should I do?",
    "  2. Negative skill test | what's the weather?",
    "  3. File review         | Review fixtures/review/broken-welcome-me/SKILL.md"
  ].join("\n");
}
