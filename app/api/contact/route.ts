import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(2000),
})

export async function POST(req: NextRequest) {
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
      subject: `Contact: ${subject} - from ${name}`,
      html: `
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <p style="white-space:pre-wrap;">${message}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact] Email send failed:', err)
    return NextResponse.json({ message: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
