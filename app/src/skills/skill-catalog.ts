import type { Skill, SkillCatalogItem } from "../types.js";
import { flattenResources } from "./resource-index.js";

export function renderCatalogForModel(catalog: SkillCatalogItem[]): string {
  const items = catalog.map((skill) => [
    "  <skill>",
    `    <name>${escapeXml(skill.name)}</name>`,
    `    <description>${escapeXml(skill.description)}</description>`,
    "  </skill>"
  ].join("\n"));
  return ["<available_skills>", ...items, "</available_skills>"].join("\n");
}

export function renderActivatedSkillForModel(skill: Skill): string {
  const resources = flattenResources(skill.resources);
  const resourceText = resources.length > 0 ? resources.map((resource) => `- ${resource}`).join("\n") : "none";
  return [
    `<activated_skill name="${escapeXml(skill.name)}">`,
    "<description>",
    escapeXml(skill.description),
    "</description>",
    "<instructions>",
    skill.body.trim(),
    "</instructions>",
    "<available_resources>",
    resourceText,
    "</available_resources>",
    "</activated_skill>"
  ].join("\n");
}

function escapeXml(input: string): string {
  return input.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
