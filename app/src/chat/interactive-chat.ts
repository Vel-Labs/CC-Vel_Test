import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { runAgent } from "../agent/run-agent.js";
import { createModelProvider, resolveModel, type ModelProvider } from "../agent/model-provider.js";
import { discoverActiveSkillMetadata } from "../skills/discover-skills.js";
import type { Skill } from "../types.js";
import { renderVelCodeBanner } from "../ui/banner.js";
import { withThinking } from "../ui/thinking.js";
import { renderPanel, renderTerminalResponse } from "../ui/terminal-render.js";
import { estimateCatalogTokens, estimateTokens, formatTokenEstimate } from "../agent/token-audit.js";

export interface InteractiveChatOptions {
  repoRoot: string;
  trace?: boolean;
  mock?: boolean;
  model?: string;
}

export async function runInteractiveChat(options: InteractiveChatOptions): Promise<void> {
  const rl = readline.createInterface({ input, output });
  const skillsPromise = discoverActiveSkillMetadata(options.repoRoot);
  let trace = Boolean(options.trace);
  let mock = Boolean(options.mock);
  let pasteLines: string[] | null = null;
  let cachedProvider: ModelProvider | undefined;
  let cachedProviderKey = "";

  function getProvider(): ModelProvider {
    const key = `${mock ? "mock" : "live"}:${resolveModel(options.model)}`;
    if (!cachedProvider || cachedProviderKey !== key) {
      cachedProvider = createModelProvider({ model: options.model, mock });
      cachedProviderKey = key;
    }
    return cachedProvider;
  }

  console.log(renderVelCodeBanner());
  console.log("");
  rl.setPrompt("vel> ");
  rl.prompt();

  try {
    for await (const rawLine of rl) {
      if (pasteLines) {
        if (rawLine.trim() === "/end") {
          const pastedPrompt = pasteLines.join("\n").trim();
          pasteLines = null;
          rl.setPrompt("vel> ");
          if (pastedPrompt) {
            await runChatPrompt({ repoRoot: options.repoRoot, prompt: pastedPrompt, trace, mock, model: options.model, getSkills: () => skillsPromise, getProvider });
          }
        } else {
          pasteLines.push(rawLine);
        }
        rl.prompt();
        continue;
      }

      const prompt = rawLine.trim();
      if (!prompt) continue;

      if (isExitCommand(prompt)) break;
      if (prompt === "/paste") {
        pasteLines = [];
        console.log("Paste code or context. Finish with /end on its own line.");
        rl.setPrompt("paste> ");
        rl.prompt();
        continue;
      }
      if (prompt === "/help") {
        printHelp();
        rl.prompt();
        continue;
      }
      if (prompt === "/demo") {
        printDemoHelp();
        rl.prompt();
        continue;
      }
      if (prompt === "/trace") {
        trace = !trace;
        console.log(`trace: ${trace ? "on" : "off"}`);
        rl.prompt();
        continue;
      }
      if (isGenieWishPrompt(prompt)) {
        console.log("");
        printGenieWish();
        console.log("");
        rl.prompt();
        continue;
      }
      if (prompt === "/mock") {
        mock = !mock;
        cachedProvider = undefined;
        cachedProviderKey = "";
        console.log(`mock: ${mock ? "on" : "off"}`);
        rl.prompt();
        continue;
      }

      const suggestedPrompt = resolveSuggestedPrompt(prompt);
      if (suggestedPrompt === "/paste") {
        pasteLines = [];
        console.log("Paste code or context. Finish with /end on its own line.");
        rl.setPrompt("paste> ");
        rl.prompt();
        continue;
      }

      await runChatPrompt({ repoRoot: options.repoRoot, prompt: suggestedPrompt ?? prompt, trace, mock, model: options.model, getSkills: () => skillsPromise, getProvider });
      rl.prompt();
    }
  } finally {
    rl.close();
  }
}

interface ChatPromptRunOptions extends InteractiveChatOptions {
  prompt: string;
  getProvider: () => ModelProvider;
  getSkills: () => Promise<Skill[]>;
}

async function runChatPrompt(options: ChatPromptRunOptions): Promise<void> {
  try {
    const skills = await options.getSkills();
    const estimate = estimateTokens(options.prompt) + estimateCatalogTokens(skills);
    const result = await withThinking(runAgent({
        repoRoot: options.repoRoot,
        prompt: options.prompt,
        trace: options.trace,
        mock: options.mock,
        model: options.model,
        skills,
        provider: options.getProvider()
      }),
      !options.mock,
      `${formatTokenEstimate(estimate)} local estimate`
    );
    console.log("");
    const status = result.selectedSkill === null
      ? [
          "No skill activated",
          "Answering normally without loading unrelated skill bodies.",
          "For repeatable workflows, ask me to create a skill and I will draft it behind the install gate."
        ].join("\n")
      : [
          `Activated skill: ${result.selectedSkill}`,
          "Loaded only the selected skill body."
        ].join("\n");

    console.log(renderPanel("Skill Routing", status));
    console.log("");
    console.log(renderPanel("Vel Code", renderTerminalResponse(result.output)));
    if (options.trace) {
      console.log("");
      console.log(result.traceText);
    }
    console.log("");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    console.log("");
  }
}

function isExitCommand(prompt: string): boolean {
  return prompt === "/exit" || prompt === "/quit" || prompt === "exit" || prompt === "quit";
}

function printHelp(): void {
  console.log([
    "Vel Code commands:",
    "  /help   Show this help",
    "  /trace  Toggle skill trace output",
    "  /demo   Show the guided lifecycle demo command",
    "  /paste  Paste multi-line code or context, then finish with /end",
    "  /exit   Leave the chat",
    "",
    "Advanced:",
    "  /mock   Toggle deterministic mock mode for local debugging",
    "",
    "Display:",
    "  Live chat calls show a status line while Claude works.",
    "  Direct npm prompt mode stays plain so welcome smoke tests keep exact output.",
    "",
    "Suggested prompts:",
    "  Enter 1, 2, or 3 to run a suggested prompt.",
    "  1. Required welcome    | I'm new to this project, what should I do?",
    "  2. Negative skill test | what's the weather?",
    "  3. File review         | Review fixtures/review/broken-welcome-me/SKILL.md"
  ].join("\n"));
}

function printDemoHelp(): void {
  console.log("Run `npm run demo` to see the guided skill lifecycle and generated-skill draft demo.");
}

function isGenieWishPrompt(prompt: string): boolean {
  return /\bgenie\b|\bwish\b|\bcreative intent\b/i.test(prompt);
}

function printGenieWish(): void {
  console.log([
    "Genie Wish is the creative layer of Vel Code:",
    "",
    "- The core demo uses three active skills and correct lazy loading.",
    "- `skill-creator` shows that one of those skills can draft future skills.",
    "- Drafts stay outside the active catalog until validation and explicit install.",
    "",
    "Run `npm run demo` for the guided version, or `npm run skills:draft -- \"Create a skill for reviewing small TypeScript files\"` to inspect the gate directly."
  ].join("\n"));
}

function resolveSuggestedPrompt(prompt: string): string | null {
  switch (prompt) {
    case "1":
      return "I'm new to this project, what should I do?";
    case "2":
      return "what's the weather?";
    case "3":
      return "Review fixtures/review/broken-welcome-me/SKILL.md";
    default:
      return null;
  }
}
