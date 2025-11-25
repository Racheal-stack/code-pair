'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function EmailTestPage() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testEmail = async () => {
    if (!email) {
      alert('Please enter an email address')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to: email })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to test email', details: (error as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-6">📧 Email Service Test</h1>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Test Email Address</label>
              <Input
                type="email"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Button 
              onClick={testEmail}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Sending Test Email...' : 'Send Test Email'}
            </Button>
          </div>

          {result && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Result:</h3>
              
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>

              {result.result?.success && !result.result?.development && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    ✅ <strong>Success!</strong> Email sent successfully. Check the recipient's inbox.
                  </p>
                </div>
              )}

              {result.result?.development && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    ⚠️ <strong>Development Mode:</strong> Email was not actually sent. Check the server console for the email content.
                  </p>
                </div>
              )}

              {!result.result?.success && result.result?.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">
                    ❌ <strong>Error:</strong> {result.result.error}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Configuration Check:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Make sure your RESEND_API_KEY is valid</li>
              <li>• Check that your sending domain is verified in Resend</li>
              <li>• Ensure FROM_EMAIL uses a verified domain</li>
              <li>• Check spam/junk folder if email doesn't arrive</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}