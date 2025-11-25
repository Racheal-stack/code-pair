import { NextRequest, NextResponse } from 'next/server'

import fs from 'fs'
import path from 'path'

const challengesFilePath = path.join(process.cwd(), 'challenges.json')

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category: string
  tags: string[]
  estimatedTime: string
  createdBy: string
  createdAt: string
  starterCode?: string
  testCases?: Array<{
    input: string
    expectedOutput: string
    description?: string
  }>
}

function loadChallenges(): Challenge[] {
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

function saveChallenges(challenges: Challenge[]): void {
  try {
    fs.writeFileSync(challengesFilePath, JSON.stringify(challenges, null, 2))
  } catch (error) {
    console.error('Error saving challenges:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    console.log('Challenges API - Authorization header:', authorization ? 'Present' : 'Missing')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('Challenges API - Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const challenges = loadChallenges()
    console.log('Challenges API - Loaded challenges count:', challenges.length)
    return NextResponse.json(challenges)
    
  } catch (error) {
    console.error('Challenges fetch error:', error)
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
    const challenges = loadChallenges()
    
    const newChallenge: Challenge = {
      id: Date.now().toString(),
      title: body.title,
      description: body.description,
      difficulty: body.difficulty,
      category: body.category,
      tags: body.tags || [],
      estimatedTime: body.estimatedTime,
      createdBy: body.createdBy,
      createdAt: new Date().toISOString(),
      starterCode: body.starterCode,
      testCases: body.testCases || []
    }
    
    challenges.push(newChallenge)
    saveChallenges(challenges)
    
    return NextResponse.json({
      message: 'Challenge created successfully',
      challenge: newChallenge
    })
    
  } catch (error) {
    console.error('Challenge creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}