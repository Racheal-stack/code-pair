import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { EmailService } from '@/lib/email-service'

// Schema for invitation validation
const invitationSchema = z.object({
  interviewId: z.string(),
  candidateEmail: z.string().email(),
  interviewTitle: z.string(),
  interviewDate: z.string(),
  interviewTime: z.string(),
  platform: z.string(),
  platformLink: z.string().optional(),
  interviewerName: z.string(),
  questions: z.array(z.string()).optional(),
  assessmentMode: z.string().optional(),
  selectedChallenges: z.array(z.string()).optional()
})

// In-memory storage for invitations (in production, use a database)
let invitations: Array<{
  id: string
  interviewId: string
  candidateEmail: string
  status: 'sent' | 'accepted' | 'declined'
  sentAt: string
  token: string
  interviewDetails: any
}> = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const result = invitationSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid invitation data', details: result.error.issues },
        { status: 400 }
      )
    }
    
    const invitationData = result.data
    
    // Generate invitation token
    const invitationToken = Buffer.from(`${invitationData.interviewId}:${invitationData.candidateEmail}:${Date.now()}`).toString('base64')
    
    // Create invitation record
    const invitation = {
      id: Date.now().toString(),
      interviewId: invitationData.interviewId,
      candidateEmail: invitationData.candidateEmail,
      status: 'sent' as const,
      sentAt: new Date().toISOString(),
      token: invitationToken,
      interviewDetails: invitationData
    }
    
    invitations.push(invitation)
    
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/interview/join/${invitationToken}`
    
    // Send actual email
    const emailData = EmailService.createInvitationEmail({
      candidateEmail: invitationData.candidateEmail,
      interviewTitle: invitationData.interviewTitle,
      interviewDate: invitationData.interviewDate,
      interviewTime: invitationData.interviewTime,
      interviewerName: invitationData.interviewerName,
      platform: invitationData.platform,
      platformLink: invitationData.platformLink,
      joinLink: invitationLink,
      assessmentMode: invitationData.assessmentMode || 'live',
      challengeCount: invitationData.questions?.length || 0
    })

    const emailResult = await EmailService.sendEmail({
      to: invitationData.candidateEmail,
      subject: emailData.subject,
      html: emailData.html
    })

    console.log('📧 Email sent to:', invitationData.candidateEmail, emailResult.success ? '✅' : '❌')
    
    return NextResponse.json({
      message: 'Interview invitation sent successfully',
      invitationId: invitation.id,
      joinLink: invitationLink,
      emailResult: emailResult,
      emailContent: {
        subject: emailData.subject,
        body: `Interview invitation has been sent via email to ${invitationData.candidateEmail}`
      }
    })
    
  } catch (error) {
    console.error('Invitation send error:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all invitations (in production, filter by user permissions)
    return NextResponse.json({
      invitations: invitations.map(inv => ({
        id: inv.id,
        interviewId: inv.interviewId,
        candidateEmail: inv.candidateEmail,
        status: inv.status,
        sentAt: inv.sentAt,
        interviewTitle: inv.interviewDetails.interviewTitle
      }))
    })
  } catch (error) {
    console.error('Invitations fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}