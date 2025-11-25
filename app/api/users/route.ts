import { NextRequest, NextResponse } from 'next/server'
import { userStorage } from '@/lib/user-storage'

export async function GET(request: NextRequest) {
  try {
    const users = userStorage.getAll()
    return NextResponse.json({
      count: users.length,
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
        // Don't return passwords for security
      }))
    })
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}