"use client"

import Link from "next/link"
import { ArrowRight, Code2, Users, Zap } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary">
      <nav className="border-b border-border bg-secondary/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">CodePair</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-4 py-2 text-foreground hover:text-primary transition">
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-balance">
          Interview Code <span className="text-primary">Together</span>
        </h1>
        <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto text-balance">
          Real-time collaborative coding interviews with live code sharing, instant feedback, and comprehensive test
          cases.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold flex items-center gap-2"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border border-border text-foreground hover:bg-secondary rounded-lg transition font-semibold"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 border border-border rounded-lg bg-secondary/30 hover:bg-secondary/50 transition">
            <Zap className="w-8 h-8 text-accent mb-4" />
            <h3 className="text-lg font-semibold mb-2">Real-Time Collaboration</h3>
            <p className="text-foreground/70">
              See code changes instantly as you interview with live cursor tracking and syntax highlighting.
            </p>
          </div>
          <div className="p-6 border border-border rounded-lg bg-secondary/30 hover:bg-secondary/50 transition">
            <Users className="w-8 h-8 text-accent mb-4" />
            <h3 className="text-lg font-semibold mb-2">Flexible Roles</h3>
            <p className="text-foreground/70">
              Switch between candidate and interviewer modes with role-based features and permissions.
            </p>
          </div>
          <div className="p-6 border border-border rounded-lg bg-secondary/30 hover:bg-secondary/50 transition">
            <Code2 className="w-8 h-8 text-accent mb-4" />
            <h3 className="text-lg font-semibold mb-2">Multiple Languages</h3>
            <p className="text-foreground/70">
              Support for Python, JavaScript, Java, C++ and more with real-time code execution.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
