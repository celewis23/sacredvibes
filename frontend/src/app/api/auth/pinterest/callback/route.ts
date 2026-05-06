import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${request.headers.get('host')}`
  const returnTo = '/admin/projects'

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}${returnTo}`)
  }

  const clientId = process.env.NEXT_PUBLIC_PINTEREST_CLIENT_ID ?? ''
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET ?? ''

  try {
    const res = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${baseUrl}/api/auth/pinterest/callback`,
      }),
    })

    if (!res.ok) throw new Error('Pinterest token exchange failed')

    const data = await res.json()
    const expiresIn = data.expires_in ?? 2592000 // 30 days default

    // Pass tokens back to the client via hash fragment (not query params — stays out of server logs)
    const redirectUrl = new URL(`${baseUrl}${returnTo}`)
    redirectUrl.hash = `pinterest_access_token=${encodeURIComponent(data.access_token)}&pinterest_expires_in=${expiresIn}`
    return NextResponse.redirect(redirectUrl.toString())
  } catch {
    return NextResponse.redirect(`${baseUrl}${returnTo}`)
  }
}
