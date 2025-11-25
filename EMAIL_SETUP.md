# Email Setup Guide for CodePair

## 📧 How to Enable Real Email Invitations

Currently, the platform simulates email sending for development. To send real emails to candidates, follow these steps:

### 1. Create a Resend Account (Free)
1. Go to [Resend.com](https://resend.com)
2. Sign up for a free account (50,000 emails/month free)
3. Verify your account

### 2. Get Your API Key
1. Go to [API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Give it a name like "CodePair Production"
4. Copy the API key

### 3. Add Domain (Optional for Production)
1. Go to [Domains](https://resend.com/domains)
2. Add your domain (e.g., `yourdomain.com`)
3. Follow DNS verification steps
4. Update `FROM_EMAIL` in `.env.local`

### 4. Configure Environment Variables
Add to your `.env.local` file:

```env
# Required: Your Resend API Key
RESEND_API_KEY=re_xxxxxxxxxx

# Optional: Custom from email (defaults to noreply@codepair.dev)
FROM_EMAIL=CodePair <noreply@yourdomain.com>

# Your app URL (for invitation links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Test Email Sending
1. Restart your development server: `npm run dev`
2. Create a new interview invitation
3. Check the console for email confirmation
4. The candidate should receive a professional HTML email

## 🎨 Email Features

The email includes:
- **Professional HTML design** with your branding
- **Interview details** (date, time, interviewer)
- **Assessment information** (if pre-assessment is required)
- **One-click join link** for easy access
- **Platform links** (Zoom, Google Meet, etc.)
- **Mobile-responsive** design

## 🔧 Development vs Production

### Development (No API Key)
- ✅ Shows email preview in success page
- ✅ Logs email content to console
- ✅ Provides manual invitation link
- ❌ No actual email sent

### Production (With API Key)
- ✅ Sends real HTML emails
- ✅ Professional email design
- ✅ Delivery confirmation
- ✅ Automatic candidate notifications

## 🚨 Important Notes

1. **Free Tier Limits**: Resend offers 50,000 emails/month free
2. **Domain Verification**: For custom domains, verify DNS records
3. **Email Deliverability**: Use verified domains for better delivery rates
4. **Testing**: Test with your own email first before production use

## 📞 Support

If you need help setting up email:
1. Check Resend documentation: [docs.resend.com](https://docs.resend.com)
2. Verify your API key is correct
3. Check console logs for error messages
4. Ensure your domain is verified (for custom domains)

## 🎯 Alternative Email Providers

While this setup uses Resend, you can easily modify the `EmailService` class to use:
- SendGrid
- Mailgun  
- AWS SES
- Postmark
- Or any other email service

Just update the `lib/email-service.ts` file with your preferred provider's API.