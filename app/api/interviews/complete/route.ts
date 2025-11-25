import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const completionsFilePath = path.join(process.cwd(), 'interview-completions.json')
const interviewsFilePath = path.join(process.cwd(), 'interviews.json')

function loadCompletions() {
  try {
    if (fs.existsSync(completionsFilePath)) {
      const data = fs.readFileSync(completionsFilePath, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading completions:', error)
  }
  return []
}

function saveCompletions(completions: any[]) {
  try {
    fs.writeFileSync(completionsFilePath, JSON.stringify(completions, null, 2))
  } catch (error) {
    console.error('Error saving completions:', error)
    throw new Error('Failed to save completions')
  }
}

function updateInterviewStatus(interviewId: string, status: 'completed') {
  try {
    if (fs.existsSync(interviewsFilePath)) {
      const interviews = JSON.parse(fs.readFileSync(interviewsFilePath, 'utf8'))
      const interviewIndex = interviews.findIndex((interview: any) => interview.id === interviewId)
      
      if (interviewIndex !== -1) {
        interviews[interviewIndex].status = status
        interviews[interviewIndex].completedAt = new Date().toISOString()
        fs.writeFileSync(interviewsFilePath, JSON.stringify(interviews, null, 2))
      }
    }
  } catch (error) {
    console.error('Error updating interview status:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { interviewId, completionReason, finalCode, selectedChallenge, timeRemaining, completedAt } = body
    
    if (!interviewId || !completionReason) {
      return NextResponse.json(
        { error: 'Interview ID and completion reason are required' },
        { status: 400 }
      )
    }
    
    const completions = loadCompletions()
    
    const completion = {
      id: Date.now().toString(),
      interviewId,
      completionReason,
      finalCode: finalCode || '',
      selectedChallenge,
      timeRemaining: timeRemaining || 0,
      completedAt: completedAt || new Date().toISOString(),
      submittedAt: new Date().toISOString()
    }
    
    completions.push(completion)
    saveCompletions(completions)
    
    updateInterviewStatus(interviewId, 'completed')
    
    console.log(`✅ Interview ${interviewId} completed with reason: ${completionReason}`)
    
    return NextResponse.json({
      message: 'Interview completion recorded successfully',
      completion: completion
    })
    
  } catch (error) {
    console.error('Interview completion error:', error)
    return NextResponse.json(
      { error: 'Failed to record interview completion' },
      { status: 500 }
    )
  }
}