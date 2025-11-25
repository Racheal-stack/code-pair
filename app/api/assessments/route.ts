import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const interviewsFilePath = path.join(process.cwd(), 'interviews.json')
const challengesFilePath = path.join(process.cwd(), 'challenges.json')
const assessmentsFilePath = path.join(process.cwd(), 'assessments.json')

function loadInterviews() {
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

function loadChallenges() {
  try {
    if (fs.existsSync(challengesFilePath)) {
      const data = fs.readFileSync(challengesFilePath, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading challenges:', error)
  }
  return []
}

function loadAssessments() {
  try {
    if (fs.existsSync(assessmentsFilePath)) {
      const data = fs.readFileSync(assessmentsFilePath, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading assessments:', error)
  }
  return []
}

function saveAssessments(assessments: any[]) {
  try {
    fs.writeFileSync(assessmentsFilePath, JSON.stringify(assessments, null, 2))
  } catch (error) {
    console.error('Error saving assessments:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const candidateEmail = searchParams.get('candidateEmail')
    const interviewId = searchParams.get('interviewId')
    
    if (!candidateEmail) {
      return NextResponse.json({ error: 'Candidate email required' }, { status: 400 })
    }

    const interviews = loadInterviews()
    const challenges = loadChallenges()
    const assessments = loadAssessments()

    const candidateInterviews = interviews.filter((interview: any) => 
      interview.candidateEmail === candidateEmail && 
      interview.selectedChallenges && 
      interview.selectedChallenges.length > 0 &&
      (interview.assessmentMode === 'assessment' || interview.assessmentMode === 'both')
    )

    if (interviewId) {
      const interview = candidateInterviews.find((int: any) => int.id === interviewId)
      if (!interview) {
        return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
      }

      const interviewChallenges = challenges.filter((challenge: any) => 
        interview.selectedChallenges.includes(challenge.id)
      )

      const existingAssessment = assessments.find((assessment: any) => 
        assessment.interviewId === interviewId && assessment.candidateEmail === candidateEmail
      )

      return NextResponse.json({
        interview,
        challenges: interviewChallenges,
        assessment: existingAssessment,
        isCompleted: !!existingAssessment?.completedAt
      })
    }

    const candidateAssessments = candidateInterviews.map((interview: any) => {
      const existingAssessment = assessments.find((assessment: any) => 
        assessment.interviewId === interview.id && assessment.candidateEmail === candidateEmail
      )
      
      return {
        id: interview.id,
        title: interview.title,
        interviewerName: interview.interviewerName,
        date: interview.date,
        time: interview.time,
        challengeCount: interview.selectedChallenges.length,
        status: existingAssessment?.completedAt ? 'completed' : 'pending',
        completedAt: existingAssessment?.completedAt
      }
    })

    return NextResponse.json({ assessments: candidateAssessments })

  } catch (error) {
    console.error('Assessment fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { interviewId, candidateEmail, solutions } = body

    if (!interviewId || !candidateEmail || !solutions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const assessments = loadAssessments()
    
    const existingIndex = assessments.findIndex((assessment: any) => 
      assessment.interviewId === interviewId && assessment.candidateEmail === candidateEmail
    )

    const assessmentData = {
      id: existingIndex >= 0 ? assessments[existingIndex].id : Date.now().toString(),
      interviewId,
      candidateEmail,
      solutions,
      submittedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    }

    if (existingIndex >= 0) {
      assessments[existingIndex] = assessmentData
    } else {
      assessments.push(assessmentData)
    }

    saveAssessments(assessments)

    return NextResponse.json({ 
      message: 'Assessment submitted successfully',
      assessmentId: assessmentData.id
    })

  } catch (error) {
    console.error('Assessment submission error:', error)
    return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 })
  }
}