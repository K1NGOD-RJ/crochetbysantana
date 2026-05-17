import { Resend } from 'resend'
import { json } from './_sheets.js'

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {})
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return json(500, { error: 'RESEND_API_KEY não configurado.' })

  try {
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from: 'CrochetbySantana <onboarding@resend.dev>',
      to: 'joaovictorcardosoprotazio@gmail.com',
      subject: 'Teste de email — CrochetbySantana',
      html: '<h2>Hello World!</h2><p>O sistema de notificações está a funcionar.</p>',
    })
    return json(200, { ok: true, id: result.data?.id })
  } catch (err) {
    return json(500, { error: err.message })
  }
}
