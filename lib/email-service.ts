import { Resend } from 'resend'

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not found, email service will use fallback mode')
    return null
  }
  return new Resend(apiKey)
}

export interface EmailData {
  to: string
  subject: string
  html: string
}

export class EmailService {
  static async sendEmail({ to, subject, html }: EmailData) {
    try {
      if (!process.env.RESEND_API_KEY || process.env.DISABLE_EMAIL === 'true') {
        console.log('📧 Email Service - Development Mode')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📬 To:', to)
        console.log('📋 Subject:', subject)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        
        if (!process.env.RESEND_API_KEY) {
          console.log('⚠️ RESEND_API_KEY not configured')
          console.log('👉 To enable emails: Add RESEND_API_KEY to .env.local')
          console.log('🌐 Get API key: https://resend.com/api-keys')
        } else {
          console.log('✅ Email sending disabled (DISABLE_EMAIL=true)')
        }
        
        return { success: true, data: { id: 'dev-mode' }, development: true }
      }

      const resend = getResendClient()
      if (!resend) {
        console.error('❌ Resend client not available')
        return { success: false, error: 'Email service not configured' }
      }

      const { data, error } = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'CodePair <noreply@codepair.dev>',
        to: [to],
        subject,
        html
      })

      if (error) {
        console.error('❌ Email send error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Email sent successfully:', data)
      return { success: true, data }

    } catch (error) {
      console.error('❌ Email service error:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  static createInvitationEmail(data: {
    candidateName?: string
    candidateEmail: string
    interviewTitle: string
    interviewDate: string
    interviewTime: string
    interviewerName: string
    platform: string
    platformLink?: string
    joinLink: string
    assessmentMode: string
    challengeCount?: number
  }) {
    const { 
      candidateName, 
      interviewTitle, 
      interviewDate, 
      interviewTime, 
      interviewerName, 
      platform, 
      platformLink,
      joinLink,
      assessmentMode,
      challengeCount
    } = data

    const greeting = candidateName ? `Dear ${candidateName}` : 'Hello'
    
    const assessmentInfo = assessmentMode === 'assessment' || assessmentMode === 'both' 
      ? `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
          <h3 style="margin: 0 0 10px 0; color: #007bff;">📝 Pre-Interview Assessment</h3>
          <p style="margin: 0; color: #666;">
            You have ${challengeCount || 0} coding challenge${challengeCount !== 1 ? 's' : ''} to complete before the interview. 
            Please complete them at your convenience before the scheduled interview time.
          </p>
        </div>
      ` 
      : ''

    const liveSessionInfo = assessmentMode === 'live' || assessmentMode === 'both'
      ? `
        <div style="background: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin: 0 0 10px 0; color: #28a745;">💻 Live Coding Session</h3>
          <p style="margin: 0; color: #666;">
            We'll conduct a live coding session during the interview where you'll collaborate with the interviewer in real-time.
          </p>
        </div>
      `
      : ''

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Interview Invitation - ${interviewTitle}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-flex; align-items: center; gap: 10px; background: #f8f9fa; padding: 15px 25px; border-radius: 50px;">
          <span style="font-size: 24px;">💼</span>
          <h1 style="margin: 0; font-size: 24px; color: #007bff;">CodePair</h1>
        </div>
      </div>

      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: 1px solid #e9ecef;">
        
        <h2 style="color: #007bff; margin-top: 0;">🎉 You're Invited to a Coding Interview!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">${greeting},</p>
        
        <p>You have been invited to participate in a coding interview. Here are the details:</p>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #495057;">📋 Interview Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Title:</strong></td>
              <td style="padding: 8px 0;">${interviewTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
              <td style="padding: 8px 0;">${interviewDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Time:</strong></td>
              <td style="padding: 8px 0;">${interviewTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Interviewer:</strong></td>
              <td style="padding: 8px 0;">${interviewerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Platform:</strong></td>
              <td style="padding: 8px 0;">${platform}${platformLink ? ` - <a href="${platformLink}" style="color: #007bff;">Join Meeting</a>` : ''}</td>
            </tr>
          </table>
        </div>

        ${assessmentInfo}
        ${liveSessionInfo}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${joinLink}" 
             style="display: inline-block; background: #007bff; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background 0.3s;">
            🚀 Get Started
          </a>
        </div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>📌 Important:</strong> Click the "Get Started" button above to access the interview platform. 
            If you don't have an account, you'll be guided through a quick signup process.
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #666;">
          <p>If you have any questions or need to reschedule, please contact ${interviewerName} directly.</p>
          <p>We look forward to meeting with you!</p>
          <p style="margin-bottom: 0;"><strong>Best regards,<br>The CodePair Team</strong></p>
        </div>

      </div>

      <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
        <p>This email was sent by CodePair. If you received this email by mistake, please ignore it.</p>
      </div>

    </body>
    </html>
    `

    return {
      subject: `Interview Invitation: ${interviewTitle} - ${interviewDate}`,
      html
    }
  }
}