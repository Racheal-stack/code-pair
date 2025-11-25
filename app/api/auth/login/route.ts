import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { userStorage } from '@/lib/user-storage'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = loginSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      )
    }
    
    const { email, password } = result.data
    
    console.log('=== LOGIN ATTEMPT ===')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('Total users in storage:', userStorage.getAll().length)
    console.log('All users emails:', userStorage.getAll().map(u => u.email))
    
    const user = userStorage.findByEmail(email)
    console.log('Found user:', user ? { email: user.email, password: user.password } : null)
    
    if (!user) {
      console.log('❌ No user found with email:', email)
      return NextResponse.json(
        { error: 'No user found with this email address' },
        { status: 401 }
      )
    }
    
    if (user.password !== password) {
      console.log('❌ Password mismatch:')
      console.log('  - Stored password:', `"${user.password}"`)
      console.log('  - Provided password:', `"${password}"`)
      console.log('  - Passwords match:', user.password === password)
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }
    
    console.log('✅ Login successful for:', email)
    
    const token = Buffer.from(`${user.id}:${user.email}`).toString('base64')
    
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}