import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { escapeHtml } from '@/lib/html-escape'
import { rateLimit, getIp } from '@/lib/rate-limit'

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(2000),
})

export async function POST(req: NextRequest) {
  // 5 submissions per IP per 10 minutes
  const { success } = rateLimit(`contact:${getIp(req)}`, 5, 10 * 60 * 1000)
  if (!success) {
    return NextResponse.json({ message: 'Too many requests. Please wait before trying again.' }, { status: 429 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: 'Invalid body.' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid form data.' }, { status: 400 })
  }

  const { name, email, subject, message } = parsed.data

  try {
    await resend.emails.send({
      from: 'The Possah <noreply@thepossah.com>',
      to: 'hello@thepossah.com',
      reply_to: email,
      // Subject is a mail header — collapse any CR/LF to prevent header
      // injection, and keep it plain (no HTML rendered in subject lines).
      subject: `Contact: ${subject.replace(/[\r\n]+/g, ' ')} - from ${name.replace(/[\r\n]+/g, ' ')}`,
      // SECURITY (audit S-1): HTML-escape every user-supplied value so markup
      // or phishing links cannot be injected into the team inbox email.
      html: `
        <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <hr>
        <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact] Email send failed:', err)
    return NextResponse.json({ message: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
