"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Copy, Play } from "lucide-react"

interface CodeEditorProps {
  code: string
  language: string
  onCodeChange: (code: string) => void
  onLanguageChange: (language: string) => void
  onRunTests?: () => void
  isReadOnly?: boolean
}

export default function CodeEditor({
  code,
  language,
  onCodeChange,
  onLanguageChange,
  onRunTests,
  isReadOnly = false,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [lineNumbers, setLineNumbers] = useState<string[]>([])

  useEffect(() => {
    const lines = code.split("\n").length
    setLineNumbers(Array.from({ length: lines }, (_, i) => (i + 1).toString()))
  }, [code])

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onCodeChange(e.target.value)
    },
    [onCodeChange],
  )

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className="flex flex-col h-full bg-secondary rounded-lg border border-border overflow-hidden">
      <div className="flex gap-4 items-center px-4 py-3 border-b border-border bg-secondary/50">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="px-3 py-1 bg-background border border-border rounded text-sm text-foreground"
          disabled={isReadOnly}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="typescript">TypeScript</option>
        </select>

        <div className="flex-1" />

        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-secondary rounded transition text-foreground/60 hover:text-foreground"
          title="Copy code"
        >
          <Copy className="w-4 h-4" />
        </button>

        {onRunTests && !isReadOnly && (
          <button
            onClick={onRunTests}
            className="px-4 py-1 bg-primary text-white rounded hover:bg-primary-dark transition text-sm font-semibold flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Run Tests
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="bg-background/50 border-r border-border px-3 py-4 text-xs text-foreground/50 font-mono overflow-hidden">
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6">
              {num}
            </div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleCodeChange}
          readOnly={isReadOnly}
          className="flex-1 p-4 bg-background text-foreground font-mono text-sm outline-none resize-none"
          spellCheck="false"
        />
      </div>
    </div>
  )
}
