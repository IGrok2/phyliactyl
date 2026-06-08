"use client"

import * as React from "react"
import Editor from "react-simple-code-editor"
import Prism from "prismjs"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-json"
import "prismjs/components/prism-yaml"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-properties"
import "prismjs/components/prism-markup"
import "prismjs/components/prism-css"
import "prismjs/components/prism-python"
import "prismjs/components/prism-sql"
import "prismjs/components/prism-toml"
import "prismjs/themes/prism-tomorrow.css"
import { langForFile } from "@/components/panel/code-lang"

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export default function CodeEditor({
  value,
  onChange,
  filename,
}: {
  value: string
  onChange: (v: string) => void
  filename: string
}) {
  const lang = langForFile(filename)
  const grammar = lang ? Prism.languages[lang] : null

  return (
    <Editor
      value={value}
      onValueChange={onChange}
      highlight={(code) =>
        grammar ? Prism.highlight(code, grammar, lang) : escapeHtml(code)
      }
      padding={16}
      textareaClassName="outline-none"
      className="min-h-full"
      style={{
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontSize: 12.5,
        lineHeight: 1.6,
        color: "#e5e5e5",
      }}
    />
  )
}
