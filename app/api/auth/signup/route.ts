import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { userStorage, type User } from '@/lib/user-storage'

// Define the schema for signup validation
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CANDIDATE', 'INTERVIEWER'])
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const result = signupSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      )
    }
    
    const { name, email, password, role } = result.data
    
    // Check if user already exists
    const existingUser = userStorage.findByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      )
    }
    
    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      password, // In a real app, hash the password
      role
    }
    
    console.log('Creating new user:', newUser)
    userStorage.add(newUser)
    console.log('All users after signup:', userStorage.getAll())
    
    // Generate a simple token (in a real app, use JWT)
    const token = Buffer.from(`${newUser.id}:${newUser.email}`).toString('base64')
    
    // Return success response
    return NextResponse.json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    })
    
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}