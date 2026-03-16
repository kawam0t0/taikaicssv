import { NextRequest, NextResponse } from 'next/server'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

// Next.js App Router 用のサイズ上限設定
export const maxDuration = 60

const SPREADSHEET_ID = process.env.SPREADSHEET_ID ?? '1Q4kJ1YBNRs3_ScblMpzxDHif60u79i9G3EoVb60pZaU'
const SHEET_NAME = process.env.SHEET_NAME ?? '退会確認CSV'
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GOOGLE_PRIVATE_KEY

  if (!email || !rawKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL または GOOGLE_PRIVATE_KEY が設定されていません')
  }

  const privateKey = rawKey.replace(/\\n/g, '\n')

  // JWT を手動で組み立てる（googleapis パッケージ不要）
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url')

  const signingInput = `${encode(header)}.${encode(payload)}`

  // Web Crypto API でRS256署名
  const pemContents = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')
  const binaryKey = Buffer.from(pemContents, 'base64')

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    Buffer.from(signingInput)
  )

  const jwt = `${signingInput}.${Buffer.from(signature).toString('base64url')}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`アクセストークン取得失敗: ${err}`)
  }

  const tokenData = await tokenRes.json()
  return tokenData.access_token as string
}

async function clearSheet(accessToken: string): Promise<void> {
  const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}:clear`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`シートのクリアに失敗しました: ${err}`)
  }
}

async function writeSheet(accessToken: string, values: string[][]): Promise<number> {
  const range = `${SHEET_NAME}!A1`
  const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`シートへの書き込みに失敗しました: ${err}`)
  }
  const data = await res.json()
  return data.updatedRows ?? values.length
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { headers, rows } = body as { headers: string[]; rows: string[][] }

    if (!Array.isArray(headers) || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'リクエストデータが不正です' }, { status: 400 })
    }

    const values = [headers, ...rows]
    const accessToken = await getAccessToken()
    await clearSheet(accessToken)
    const updatedRows = await writeSheet(accessToken, values)

    return NextResponse.json({
      success: true,
      updatedRows,
      message: `${updatedRows} 行をスプレッドシートに反映しました`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '予期しないエラーが発生しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
