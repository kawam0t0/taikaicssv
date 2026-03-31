import { type NextRequest, NextResponse } from 'next/server'
import { getAccessToken, writeRows } from '@/lib/sheets'

export const maxDuration = 30

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json()
    const { rows, startRow } = body as { rows: string[][]; startRow: number }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'rows が空です' }, { status: 400 })
    }

    const accessToken = await getAccessToken()
    const updatedRows = await writeRows(accessToken, rows, startRow ?? 1)

    return NextResponse.json({ success: true, updatedRows })
  } catch (error) {
    const message = error instanceof Error ? error.message : '予期しないエラーが発生しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
