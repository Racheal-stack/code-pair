import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json()
    
    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    console.log('🧪 Testing email service with:', {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Present' : 'Missing',
      FROM_EMAIL: process.env.FROM_EMAIL,
      DISABLE_EMAIL: process.env.DISABLE_EMAIL,
      NODE_ENV: process.env.NODE_ENV
    })

    const result = await EmailService.sendEmail({
      to,
      subject: '🧪 Test Email from CodePair',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test Email</h2>
          <p>This is a test email to verify that your Resend integration is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from CodePair using Resend API.
          </p>
        </div>
      `
    })

    console.log('🧪 Email test result:', result)

    return NextResponse.json({
      message: 'Email test completed',
      result
    })
    
  } catch (error) {
    console.error('🧪 Email test error:', error)
    return NextResponse.json(
      { error: 'Email test failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}