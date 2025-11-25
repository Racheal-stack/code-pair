"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import InterviewEditor from "@/components/interview/interview-editor"

export default function InterviewPage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentSession = localStorage.getItem('currentSession')
    const token = currentSession ? localStorage.getItem(`token_${currentSession}`) : null
    if (!token) {
      router.push("/login")
      return
    }

    setLoading(false)
  }, [router])

  if (loading) return null

  return <InterviewEditor sessionId={params.id as string} />
}
