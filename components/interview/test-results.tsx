"use client"

import { Check, X } from "lucide-react"

interface TestResult {
  name: string
  passed: boolean
  expected: string
  actual: string
  error?: string
}

interface TestResultsProps {
  results: TestResult[]
  isRunning?: boolean
}

export default function TestResults({ results, isRunning = false }: TestResultsProps) {
  const passed = results.filter((r) => r.passed).length
  const failed = results.length - passed

  return (
    <div className="bg-secondary/30 border border-border rounded-lg p-4">
      {isRunning ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-foreground/60 mt-2">Running tests...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-4 text-foreground/60 text-sm">Run tests to see results</div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-4 justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{passed}</p>
              <p className="text-xs text-foreground/60">Passed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{failed}</p>
              <p className="text-xs text-foreground/60">Failed</p>
            </div>
          </div>

          <div className="space-y-2">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  result.passed ? "bg-green-900/20 border-green-500/30" : "bg-red-900/20 border-red-500/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {result.passed ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                  <p className="text-sm font-semibold text-foreground">{result.name}</p>
                </div>
                {!result.passed && (
                  <div className="text-xs text-foreground/70 space-y-1">
                    {result.error && <p>Error: {result.error}</p>}
                    <p>Expected: {result.expected}</p>
                    <p>Got: {result.actual}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
