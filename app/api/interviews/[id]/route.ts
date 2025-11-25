import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const interviewsFilePath = path.join(process.cwd(), 'interviews.json')

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

function saveInterviews(interviews: any[]) {
  try {
    fs.writeFileSync(interviewsFilePath, JSON.stringify(interviews, null, 2))
  } catch (error) {
    console.error('Error saving interviews:', error)
    throw new Error('Failed to save interviews')
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const interviews = loadInterviews()
    const interview = interviews.find((int: any) => int.id === id)
    
    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ interview })
    
  } catch (error) {
    console.error('Interview fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const interviews = loadInterviews()
    
    const interviewIndex = interviews.findIndex((i: any) => i.id === id)
    if (interviewIndex === -1) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }
    
    const existingInterview = interviews[interviewIndex]
    const updatedInterview = {
      ...existingInterview,
      ...body,
      id: id,
      updatedAt: new Date().toISOString()
    }
    
    interviews[interviewIndex] = updatedInterview
    saveInterviews(interviews)
    
    return NextResponse.json({ 
      message: 'Interview updated successfully', 
      interview: updatedInterview 
    })
  } catch (error) {
    console.error('Error updating interview:', error)
    return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const interviews = loadInterviews()
    
    const interviewIndex = interviews.findIndex((i: any) => i.id === id)
    if (interviewIndex === -1) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }
    
    const interview = interviews[interviewIndex]
    if (interview.status === 'active') {
      return NextResponse.json({ 
        error: 'Cannot delete active interview' 
      }, { status: 400 })
    }
    
    interviews.splice(interviewIndex, 1)
    saveInterviews(interviews)
    
    return NextResponse.json({ message: 'Interview deleted successfully' })
  } catch (error) {
    console.error('Error deleting interview:', error)
    return NextResponse.json({ error: 'Failed to delete interview' }, { status: 500 })
  }
}