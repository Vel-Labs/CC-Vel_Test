import path from "node:path";
import fs from "node:fs/promises";
import { readText } from "../lib/fs.js";
import type { Diagnostic, Skill, SkillFrontmatter, SkillParseMode } from "../types.js";
import { buildResourceIndex } from "./resource-index.js";

interface ParsedSkillContent {
  frontmatter: SkillFrontmatter;
  body: string;
  parseMode: SkillParseMode;
  diagnostics: Diagnostic[];
}

export class SkillParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkillParseError";
  }
}

export async function parseSkillDir(skillDir: string): Promise<Skill> {
  const skillMdPath = path.join(skillDir, "SKILL.md");
  const rawContent = await readText(skillMdPath);
  const parsed = parseSkillContent(rawContent);
  const resources = await buildResourceIndex(skillDir);
  return {
    name: parsed.frontmatter.name,
    description: parsed.frontmatter.description,
    rootDir: skillDir,
    skillMdPath,
    rawContent,
    frontmatter: parsed.frontmatter,
    body: parsed.body,
    parseMode: parsed.parseMode,
    diagnostics: parsed.diagnostics,
    resources
  };
}

export async function parseSkillMetadataDir(skillDir: string): Promise<Skill> {
  const skillMdPath = path.join(skillDir, "SKILL.md");
  const rawFrontmatter = await readFrontmatterBlock(skillMdPath);
  const frontmatter = parseLineFrontmatter(rawFrontmatter);
  const resources = await buildResourceIndex(skillDir);
  return {
    name: frontmatter.name,
    description: frontmatter.description,
    rootDir: skillDir,
    skillMdPath,
    rawContent: "",
    frontmatter,
    body: "",
    parseMode: "strict",
    diagnostics: [],
    resources
  };
}

export function parseSkillContent(rawContent: string): ParsedSkillContent {
  try {
    return parseStrictSkillContent(rawContent);
  } catch (error) {
    const strictMessage = error instanceof Error ? error.message : String(error);
    const lenient = parseLenientSkillContent(rawContent);
    return {
      ...lenient,
      diagnostics: [
        { level: "warn", message: `Strict parse failed: ${strictMessage}` },
        ...lenient.diagnostics
      ]
    };
  }
}

async function readFrontmatterBlock(filePath: string): Promise<string> {
  const handle = await fs.open(filePath, "r");
  try {
    let buffer = "";
    let offset = 0;
    const chunk = Buffer.alloc(256);
    while (buffer.length < 8192) {
      const { bytesRead } = await handle.read(chunk, 0, chunk.length, offset);
      if (bytesRead === 0) break;
      offset += bytesRead;
      buffer += chunk.subarray(0, bytesRead).toString("utf8");
      const normalized = buffer.replace(/\r\n/g, "\n");
      if (!normalized.startsWith("---\n")) {
        throw new SkillParseError("frontmatter delimiters are not standalone lines");
      }
      const closeIndex = normalized.indexOf("\n---", 4);
      if (closeIndex !== -1) return normalized.slice(4, closeIndex);
    }
    throw new SkillParseError("frontmatter block was not found before metadata read limit");
  } finally {
    await handle.close();
  }
}

export function parseStrictSkillContent(rawContent: string): ParsedSkillContent {
  const content = rawContent.replace(/\r\n/g, "\n");
  const match = /^---\n(?<frontmatter>[\s\S]*?)\n---\n?(?<body>[\s\S]*)$/m.exec(content);
  if (!match?.groups) {
    throw new SkillParseError("frontmatter delimiters are not standalone lines");
  }

  const frontmatter = parseLineFrontmatter(match.groups.frontmatter);
  const body = match.groups.body.trimStart();
  if (!body.trim()) {
    throw new SkillParseError("body is empty");
  }
  return { frontmatter, body, parseMode: "strict", diagnostics: [] };
}

export function parseLenientSkillContent(rawContent: string): ParsedSkillContent {
  const content = rawContent.replace(/\r\n/g, "\n").trim();
  if (!content.startsWith("---")) {
    throw new SkillParseError("missing opening frontmatter delimiter");
  }

  const inlineMatch = /^---\s+(?<frontmatter>[\s\S]*?)\s+---\s*(?<body>[\s\S]*)$/.exec(content);
  if (!inlineMatch?.groups) {
    throw new SkillParseError("could not recover inline frontmatter");
  }

  const frontmatter = parseInlineFrontmatter(inlineMatch.groups.frontmatter);
  const body = inlineMatch.groups.body.trimStart();
  if (!body.trim()) {
    throw new SkillParseError("recovered body is empty");
  }

  return {
    frontmatter,
    body,
    parseMode: "lenient",
    diagnostics: [{ level: "warn", message: "Recovered compressed inline frontmatter with lenient parser" }]
  };
}

function parseLineFrontmatter(frontmatter: string): SkillFrontmatter {
  const raw: Record<string, string | Record<string, string> | undefined> = {};
  const metadata: Record<string, string> = {};
  let currentMap: "metadata" | null = null;

  for (const line of frontmatter.split("\n")) {
    if (!line.trim()) continue;
    const mapEntry = /^\s{2,}([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (currentMap === "metadata" && mapEntry) {
      metadata[mapEntry[1]] = stripQuotes(mapEntry[2].trim());
      continue;
    }

    const field = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!field) continue;
    const key = field[1];
    const value = field[2].trim();
    if (key === "metadata") {
      currentMap = "metadata";
      raw.metadata = metadata;
    } else {
      currentMap = null;
      raw[key] = stripQuotes(value);
    }
  }

  return frontmatterFromRaw(raw);
}

function parseInlineFrontmatter(frontmatter: string): SkillFrontmatter {
  const knownFields = ["name", "description", "license", "compatibility", "metadata", "allowed-tools"];
  const raw: Record<string, string | Record<string, string> | undefined> = {};
  for (const field of knownFields) {
    const value = extractInlineField(frontmatter, field, knownFields);
    if (value === null) continue;
    if (field === "metadata") {
      raw.metadata = parseInlineMetadata(value);
    } else if (field === "allowed-tools") {
      raw.allowedTools = stripQuotes(value);
    } else {
      raw[field] = stripQuotes(value);
    }
  }
  return frontmatterFromRaw(raw);
}

function extractInlineField(source: string, field: string, allFields: string[]): string | null {
  const marker = `${field}:`;
  const start = source.indexOf(marker);
  if (start === -1) return null;
  const valueStart = start + marker.length;
  let valueEnd = source.length;
  for (const other of allFields) {
    if (other === field) continue;
    const otherMarker = ` ${other}:`;
    const index = source.indexOf(otherMarker, valueStart);
    if (index !== -1 && index < valueEnd) valueEnd = index;
  }
  return source.slice(valueStart, valueEnd).trim();
}

function parseInlineMetadata(value: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pairs = [...value.matchAll(/([A-Za-z0-9_-]+):\s*("[^"]+"|'[^']+'|[^\s]+(?:\s(?![A-Za-z0-9_-]+:)[^\s]+)*)/g)];
  for (const pair of pairs) {
    result[pair[1]] = stripQuotes(pair[2].trim());
  }
  return result;
}

function frontmatterFromRaw(raw: Record<string, string | Record<string, string> | undefined>): SkillFrontmatter {
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  if (!name) throw new SkillParseError("missing required name field");
  if (!description) throw new SkillParseError("missing required description field");
  return {
    name,
    description,
    license: typeof raw.license === "string" ? raw.license : undefined,
    compatibility: typeof raw.compatibility === "string" ? raw.compatibility : undefined,
    metadata: typeof raw.metadata === "object" ? raw.metadata as Record<string, string> : undefined,
    allowedTools: typeof raw["allowed-tools"] === "string" ? raw["allowed-tools"] : undefined,
    raw
  };
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
