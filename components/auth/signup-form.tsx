"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"

export default function SignupForm({ invitationInfo }: { invitationInfo?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: invitationInfo?.email || "",
    password: "",
    name: "",
    role: "CANDIDATE",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || "Signup failed")
      }

      const data = await res.json()
      
      const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('currentSession', sessionId)
      localStorage.setItem(`token_${sessionId}`, data.token)
      localStorage.setItem(`user_${sessionId}`, JSON.stringify(data.user))
      
      if (invitationInfo?.token) {
        router.push(`/interview/join/${invitationInfo.token}`)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex gap-2 items-start">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span className="text-sm text-red-200">{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Full Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="John Doe"
          className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Role</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
        >
          <option value="CANDIDATE">Candidate</option>
          <option value="INTERVIEWER">Interviewer</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {loading ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  )
}
