"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Code2, LogOut, Menu, X } from "lucide-react"
import { logout } from "@/lib/auth-utils"

interface User {
  userId: string
  email: string
  role: string
}

export default function DashboardLayout({
  user,
  children,
}: {
  user: User
  children: React.ReactNode
}) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-background">
      <div
        className={`fixed left-0 top-0 h-screen bg-secondary border-r border-border transition-all ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Code2 className="w-6 h-6 text-primary" />
              <span className="font-bold">CodePair</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-secondary rounded-lg transition">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <div className="p-4 space-y-4 mt-8">
          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-secondary/80 transition text-foreground/80 hover:text-foreground"
          >
            {sidebarOpen ? "Dashboard" : "📊"}
          </Link>
          <Link
            href="/interview"
            className="block px-4 py-2 rounded-lg hover:bg-secondary/80 transition text-foreground/80 hover:text-foreground"
          >
            {sidebarOpen ? "Interviews" : "🎤"}
          </Link>
          {user.role === 'CANDIDATE' && (
            <Link
              href="/assessment"
              className="block px-4 py-2 rounded-lg hover:bg-secondary/80 transition text-foreground/80 hover:text-foreground"
            >
              {sidebarOpen ? "Assessments" : "📝"}
            </Link>
          )}
          {user.role === 'INTERVIEWER' && (
            <Link
              href="/challenges"
              className="block px-4 py-2 rounded-lg hover:bg-secondary/80 transition text-foreground/80 hover:text-foreground"
            >
              {sidebarOpen ? "Challenges" : "🧩"}
            </Link>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-4 bg-secondary/50 rounded-lg border border-border mb-4">
            {sidebarOpen && (
              <div>
                <p className="text-xs text-foreground/60 mb-1">Logged in as</p>
                <p className="text-sm font-semibold truncate">{user.email}</p>
                <p className="text-xs text-primary mt-1">{user.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-secondary/80 border border-border rounded-lg hover:bg-secondary transition flex items-center justify-center gap-2 text-foreground/80 hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && "Logout"}
          </button>
        </div>
      </div>

      <div className={`transition-all ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  )
}
