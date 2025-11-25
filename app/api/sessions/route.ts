import { NextRequest, NextResponse } from 'next/server'

const mockSessions = [
  {
    id: "1",
    title: "Frontend Developer Interview",
    type: "Technical Interview",
    status: "scheduled",
    date: "2025-11-25",
    time: "10:00 AM",
    candidate: "John Doe",
    interviewer: "Jane Smith"
  },
  {
    id: "2", 
    title: "React Developer Assessment",
    type: "Code Review",
    status: "completed",
    date: "2025-11-24",
    time: "2:00 PM", 
    candidate: "Alice Johnson",
    interviewer: "Bob Wilson"
  }
]

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(mockSessions)
    
  } catch (error) {
    console.error('Sessions fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}