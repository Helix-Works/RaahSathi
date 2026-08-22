import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, normalize, relative, resolve } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

const sourceRoot = resolve(process.cwd(), "src");
const serverRoot = normalize(resolve(sourceRoot, "server"));

async function listTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listTypeScriptFiles(path);
    return [".ts", ".tsx"].includes(extname(entry.name)) ? [path] : [];
  }));
  return nested.flat();
}

function moduleSpecifiers(source: string, fileName: string): string[] {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
  const specifiers: string[] = [];

  function visit(node: ts.Node): void {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (ts.isImportEqualsDeclaration(node) &&
               ts.isExternalModuleReference(node.moduleReference) &&
               node.moduleReference.expression && ts.isStringLiteral(node.moduleReference.expression)) {
      specifiers.push(node.moduleReference.expression.text);
    } else if (ts.isCallExpression(node) && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) &&
               (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
                (ts.isIdentifier(node.expression) && node.expression.text === "require"))) {
      specifiers.push(node.arguments[0].text);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) &&
               ts.isStringLiteral(node.argument.literal)) {
      specifiers.push(node.argument.literal.text);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

function isClientEntry(source: string, fileName: string): boolean {
  if (normalize(fileName) === normalize(resolve(sourceRoot, "lib/api/client.ts"))) return true;
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
  const firstStatement = sourceFile.statements[0];
  return Boolean(firstStatement && ts.isExpressionStatement(firstStatement) &&
    ts.isStringLiteral(firstStatement.expression) && firstStatement.expression.text === "use client");
}

function resolveLocalModule(importer: string, specifier: string, files: Set<string>): string | undefined {
  const base = specifier.startsWith("@/")
    ? resolve(sourceRoot, specifier.slice(2))
    : specifier.startsWith(".") ? resolve(dirname(importer), specifier) : undefined;
  if (!base) return undefined;

  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    const normalized = normalize(candidate);
    if (files.has(normalized)) return normalized;
  }
  return undefined;
}

function isWithinServerRoot(path: string): boolean {
  const relation = relative(serverRoot, path);
  return relation === "" || (!relation.startsWith("..") && !isAbsolute(relation));
}

describe("server-only architecture", () => {
  it("detects every supported server-module import form", () => {
    const source = `
      import "@/server/side-effect";
      export { value } from "@/server/export";
      const dynamic = import("@/server/dynamic");
      const legacy = require("@/server/legacy");
      type Imported = import("@/server/type").Imported;
    `;
    expect(moduleSpecifiers(source, "fixture.ts")).toEqual([
      "@/server/side-effect", "@/server/export", "@/server/dynamic",
      "@/server/legacy", "@/server/type",
    ]);
  });

  it("keeps server modules out of the complete client dependency graph", async () => {
    const paths = (await listTypeScriptFiles(sourceRoot)).map(normalize);
    const fileSet = new Set(paths);
    const sources = new Map<string, string>();
    await Promise.all(paths.map(async (path) => sources.set(path, await readFile(path, "utf8"))));

    const pending = paths.filter((path) => isClientEntry(sources.get(path) ?? "", path));
    const visited = new Set<string>();
    const violations: string[] = [];

    while (pending.length > 0) {
      const path = pending.pop();
      if (!path || visited.has(path)) continue;
      visited.add(path);
      for (const specifier of moduleSpecifiers(sources.get(path) ?? "", path)) {
        const resolved = resolveLocalModule(path, specifier, fileSet);
        if (specifier === "@/server" || specifier.startsWith("@/server/") ||
            (resolved && isWithinServerRoot(resolved))) {
          violations.push(`${path} -> ${specifier}`);
        } else if (resolved) {
          pending.push(resolved);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
