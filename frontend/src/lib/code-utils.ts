export function stripTrailingNewline(code: string): string {
  return code.endsWith("\n") ? code.slice(0, -1) : code;
}

export function detectLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    go: "go",
    py: "python",
    rb: "ruby",
    rs: "rust",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    css: "css",
    scss: "scss",
    html: "html",
    xml: "xml",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    fish: "fish",
    sql: "sql",
    graphql: "graphql",
    proto: "proto",
    dockerfile: "dockerfile",
    makefile: "makefile",
    md: "markdown",
  };
  return map[ext] || "text";
}
