// Определение языка по имени файла (без зависимости от Prism, безопасно для SSR).
const EXT_TO_LANG: Record<string, string> = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  json: "json",
  yml: "yaml",
  yaml: "yaml",
  sh: "bash",
  bash: "bash",
  properties: "properties",
  env: "properties",
  cfg: "properties",
  conf: "properties",
  ini: "properties",
  html: "markup",
  xml: "markup",
  css: "css",
  py: "python",
  sql: "sql",
  toml: "toml",
}

export function langForFile(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  return EXT_TO_LANG[ext] ?? ""
}
