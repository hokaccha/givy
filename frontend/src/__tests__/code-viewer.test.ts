import { describe, it, expect } from "vitest";
import { stripTrailingNewline, detectLanguage } from "../lib/code-utils";

describe("stripTrailingNewline", () => {
  it("removes a single trailing newline", () => {
    expect(stripTrailingNewline("[tools]\nnode = \"22.11.0\"\n")).toBe(
      '[tools]\nnode = "22.11.0"'
    );
  });

  it("removes only the last newline, not all trailing newlines", () => {
    expect(stripTrailingNewline("a\n\n")).toBe("a\n");
  });

  it("returns the same string if no trailing newline", () => {
    expect(stripTrailingNewline("hello")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(stripTrailingNewline("")).toBe("");
  });

  it("handles a single newline", () => {
    expect(stripTrailingNewline("\n")).toBe("");
  });

  it("produces correct line count for a typical file with trailing newline", () => {
    const code = "[tools]\nnode = \"22.11.0\"\npostgres = \"15\"\n";
    const trimmed = stripTrailingNewline(code);
    const lines = trimmed.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("[tools]");
    expect(lines[2]).toBe('postgres = "15"');
  });

  it("produces correct line count for a file without trailing newline", () => {
    const code = "[tools]\nnode = \"22.11.0\"\npostgres = \"15\"";
    const trimmed = stripTrailingNewline(code);
    const lines = trimmed.split("\n");
    expect(lines).toHaveLength(3);
  });
});

describe("detectLanguage", () => {
  it("detects TypeScript", () => {
    expect(detectLanguage("app.ts")).toBe("typescript");
  });

  it("detects Go", () => {
    expect(detectLanguage("main.go")).toBe("go");
  });

  it("detects JSON", () => {
    expect(detectLanguage("package.json")).toBe("json");
  });

  it("detects TOML", () => {
    expect(detectLanguage("mise.toml")).toBe("toml");
  });

  it("returns text for unknown extension", () => {
    expect(detectLanguage("file.xyz")).toBe("text");
  });

  it("handles file with no extension", () => {
    expect(detectLanguage("Makefile")).toBe("makefile");
  });
});
