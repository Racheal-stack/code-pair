import { NextRequest, NextResponse } from 'next/server'

let invitations: Array<{
  id: string
  interviewId: string
  candidateEmail: string
  status: 'sent' | 'accepted' | 'declined'
  sentAt: string
  token: string
  interviewDetails: any
}> = []

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    
    const invitation = invitations.find(inv => inv.token === token)
    
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 404 }
      )
    }
    
    const invitationAge = Date.now() - new Date(invitation.sentAt).getTime()
    const maxAge = 7 * 24 * 60 * 60 * 1000
    
    if (invitationAge > maxAge) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      )
    }
    
    return NextResponse.json({
      message: 'Invitation is valid',
      invitation: invitation
    })
    
  } catch (error) {
    console.error('Invitation validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    )
  }
}