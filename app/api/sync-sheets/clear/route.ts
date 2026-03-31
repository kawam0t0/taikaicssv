import { NextResponse } from 'next/server'
import { getAccessToken, clearSheet } from '@/lib/sheets'

export const maxDuration = 30

export const POST = async (): Promise<NextResponse> => {
  try {
    const accessToken = await getAccessToken()
    await clearSheet(accessToken)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '予期しないエラーが発生しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
