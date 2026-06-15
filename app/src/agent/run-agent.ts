import { createModelProvider, resolveModel } from "./model-provider.js";
import { discoverActiveSkillMetadata, findSkill, loadSkillByName, toCatalog } from "../skills/discover-skills.js";
import { validateSkill, WELCOME_HEADER } from "../skills/validate-skill.js";
import { TraceRecorder } from "../trace/trace-recorder.js";
import { recordUsage } from "../usage/usage-ledger.js";
import type { AgentRunOptions, AgentRunResult, Skill } from "../types.js";
import { collectFileContext } from "../context/file-context.js";
import type { ModelProvider } from "./model-provider.js";
import { buildTokenAudit, formatTokenAuditTrace } from "./token-audit.js";

interface AgentRunDependencies {
  provider?: ModelProvider;
  skills?: Skill[];
}

export async function runAgent(options: AgentRunOptions & AgentRunDependencies): Promise<AgentRunResult> {
  const startedAt = performance.now();
  const trace = new TraceRecorder();
  const discoveryStartedAt = performance.now();
  const skills = options.skills ?? await discoverActiveSkillMetadata(options.repoRoot);
  const discoveryMs = performance.now() - discoveryStartedAt;
  const catalog = toCatalog(skills);
  const model = resolveModel(options.model);
  const fileContextStartedAt = performance.now();
  const fileContext = await collectFileContext(options.repoRoot, options.prompt);
  const fileContextMs = performance.now() - fileContextStartedAt;
  const modelPrompt = fileContext.text ? `${options.prompt}\n\n${fileContext.text}` : options.prompt;

  trace.add("model", options.mock ? `mock (${model})` : model);
  trace.add("skill_discovery_ms", formatMs(discoveryMs));
  trace.add("file_context_ms", formatMs(fileContextMs));
  trace.add("catalog loaded", catalog.map((skill) => skill.name).join(", "));
  trace.add("catalog count", catalog.length);
  trace.add("full skill bodies read before activation", options.skills ? "provided by test dependency" : 0);
  trace.add("full skill bodies sent to model before activation", 0);
  trace.add("local files loaded", fileContext.files.length);
  if (fileContext.files.length > 0) {
    trace.add("local file paths", fileContext.files.map((file) => file.replace(`${options.repoRoot}/`, "")).join(", "));
  }
  if (fileContext.notes.length > 0) {
    trace.add("local file notes", fileContext.notes.join("; "));
  }

  await recordUsage(options.repoRoot, { type: "run.started", prompt: options.prompt, details: { model, mock: Boolean(options.mock) } });

  const providerStartedAt = performance.now();
  const provider = options.provider ?? createModelProvider({ model: options.model, mock: options.mock });
  trace.add("provider_ready_ms", formatMs(performance.now() - providerStartedAt));
  const selectionStartedAt = performance.now();
  let selection = await provider.selectSkill(options.prompt, catalog);
  if (shouldSuppressReviewFeedbackSkill(options.prompt, fileContext.files.length, selection.skillName, selection.source)) {
    trace.add("selection override", "receiving-code-review suppressed for plain file/path review");
    selection = {
      skillName: null,
      reason: "File/path review uses bounded local file context without activating review-feedback skill",
      source: "none",
      usage: selection.usage
    };
  }
  trace.add("selection_ms", formatMs(performance.now() - selectionStartedAt));
  trace.add("activation source", selection.source);
  trace.add("activation reason", selection.reason);
  trace.add("activated", selection.skillName);

  const selectedMetadata = selection.skillName ? findSkill(skills, selection.skillName) : undefined;
  if (selection.skillName && !selectedMetadata) {
    throw new Error(`Model selected unknown skill: ${selection.skillName}`);
  }
  const activatedSkills = selectedMetadata ? [await loadActivatedSkill(options, selectedMetadata.name)] : [];

  for (const skill of activatedSkills) {
    const validation = validateSkill(skill);
    trace.add(`validated ${skill.name}`, validation.ok);
    if (!validation.ok) {
      throw new Error(`Selected skill ${skill.name} failed validation: ${validation.diagnostics.map((d) => d.message).join("; ")}`);
    }
  }

  trace.add("loaded full skill bodies", activatedSkills.length);
  trace.add("loaded unrelated skill bodies", 0);
  trace.add("loaded resources", "none");

  await recordUsage(options.repoRoot, {
    type: "skill.selected",
    prompt: options.prompt,
    skillName: selection.skillName,
    details: { reason: selection.reason, source: selection.source }
  });

  const responseStartedAt = performance.now();
  const response = await provider.respond(modelPrompt, catalog, activatedSkills);
  let output = response.text;
  trace.add("response_ms", formatMs(performance.now() - responseStartedAt));

  const tokenAudit = buildTokenAudit({
    prompt: options.prompt,
    localFileContextText: fileContext.text,
    catalog,
    activatedSkills,
    selectionUsage: selection.usage,
    responseUsage: response.usage
  });
  for (const line of formatTokenAuditTrace(tokenAudit)) {
    const [key, ...rest] = line.split(": ");
    trace.add(key, rest.join(": "));
  }

  let repairedWelcomeOutput = false;
  if (selection.skillName === "welcome-me" && !output.startsWith(WELCOME_HEADER)) {
    output = `${WELCOME_HEADER}\n\n${output.replace(/^> Welcome to our Command Code assignment agent!\s*/m, "").trimStart()}`;
    repairedWelcomeOutput = true;
  }
  if (selection.skillName === "welcome-me") {
    trace.add("postcondition", `required welcome header present: ${output.startsWith(WELCOME_HEADER)}`);
    trace.add("postcondition_repaired_output", repairedWelcomeOutput);
  }

  await recordUsage(options.repoRoot, {
    type: "run.completed",
    prompt: options.prompt,
    skillName: selection.skillName,
    details: { outputPreview: output.slice(0, 200), tokenAudit }
  });

  trace.add("total_ms", formatMs(performance.now() - startedAt));
  return { output, selectedSkill: selection.skillName, traceText: trace.toString(), tokenAudit };
}

function formatMs(ms: number): number {
  return Math.round(ms);
}

async function loadActivatedSkill(options: AgentRunOptions & AgentRunDependencies, skillName: string): Promise<Skill> {
  if (options.skills) {
    const provided = findSkill(options.skills, skillName);
    if (!provided) throw new Error(`Provided test skills did not include selected skill: ${skillName}`);
    if (provided.body.trim()) return provided;
  }
  return loadSkillByName(options.repoRoot, skillName);
}

function shouldSuppressReviewFeedbackSkill(prompt: string, loadedFileCount: number, skillName: string | null, source: string): boolean {
  if (source === "explicit") return false;
  if (skillName !== "receiving-code-review") return false;
  if (loadedFileCount === 0) return false;
  return !/\b(external feedback|review feedback|reviewer|review comment|pull request feedback|pr feedback|yagni|push back|proposed change|suggestion)\b/i.test(prompt);
}
