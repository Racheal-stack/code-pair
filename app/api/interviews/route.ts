import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const interviewsFilePath = path.join(process.cwd(), 'interviews.json')

interface Interview {
  id: string
  title: string
  type: string
  status: 'scheduled' | 'active' | 'completed'
  date: string
  time: string
  candidate: string
  candidateEmail: string
  interviewer: string
  interviewerEmail: string
  platform: string
  platformLink?: string
  description?: string
  questions: string[]
  createdAt: string
}

function loadInterviews(): Interview[] {
  try {
    if (fs.existsSync(interviewsFilePath)) {
      const data = fs.readFileSync(interviewsFilePath, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading interviews:', error)
  }
  return []
}

function saveInterviews(interviews: Interview[]): void {
  try {
    fs.writeFileSync(interviewsFilePath, JSON.stringify(interviews, null, 2))
  } catch (error) {
    console.error('Error saving interviews:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const interviews = loadInterviews()
    
    return NextResponse.json({
      interviews: interviews
    })
    
  } catch (error) {
    console.error('Interviews fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const interviews = loadInterviews()
    
    const newInterview: Interview = {
      id: body.id || Date.now().toString(),
      title: body.title,
      type: body.type,
      status: 'scheduled',
      date: body.date,
      time: body.time,
      candidate: body.candidateName || 'Candidate',
      candidateEmail: body.candidateEmail,
      interviewer: body.interviewerName,
      interviewerEmail: body.interviewerEmail,
      platform: body.platform,
      platformLink: body.platformLink,
      description: body.description,
      questions: body.questions || [],
      createdAt: new Date().toISOString()
    }
    
    interviews.push(newInterview)
    saveInterviews(interviews)
    
    return NextResponse.json({
      message: 'Interview created successfully',
      interview: newInterview
    })
    
  } catch (error) {
    console.error('Interview creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}