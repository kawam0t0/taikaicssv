'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle2, AlertCircle, Sheet, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CsvUploader, type CsvFile } from '@/components/csv-uploader'
import { useMergedCsv } from '@/hooks/use-merged-csv'
import { cn } from '@/lib/utils'

type SyncStatus = 'idle' | 'loading' | 'success' | 'error'

const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_ID ?? '1Q4kJ1YBNRs3_ScblMpzxDHif60u79i9G3EoVb60pZaU'

export default function Home() {
  const [files, setFiles] = useState<CsvFile[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const mergedData = useMergedCsv(files)

  const handleSync = async () => {
    if (!mergedData) return
    setSyncStatus('loading')
    setSyncMessage(null)

    try {
      const res = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers: mergedData.headers,
          rows: mergedData.rows,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'エラーが発生しました')
      setSyncStatus('success')
      setSyncMessage(data.message)
    } catch (e) {
      setSyncStatus('error')
      setSyncMessage(e instanceof Error ? e.message : '予期しないエラーが発生しました')
    }
  }

  const sheetsUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
              <Sheet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground leading-tight">
                CSV マージ & スプレッドシート連携
              </h1>
              <p className="text-xs text-muted-foreground">
                複数のCSVをマージして Google Sheets に反映
              </p>
            </div>
          </div>
          <a
            href={sheetsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            スプレッドシートを開く
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8 flex flex-col gap-4">
        {/* Upload Section */}
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">CSVファイルをアップロード</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                複数ファイルを選択できます。最初のファイルのヘッダーが使用されます。
              </p>
            </div>
            <CsvUploader files={files} onFilesChange={setFiles} />
          </div>
        </Card>

        {/* Sync Button */}
        {mergedData && (
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSync}
              disabled={syncStatus === 'loading'}
              size="lg"
              className="w-full"
            >
              {syncStatus === 'loading' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  反映中...
                </>
              ) : (
                <>
                  <Sheet className="w-4 h-4 mr-2" />
                  スプレッドシートに反映
                </>
              )}
            </Button>

            {syncMessage && (
              <div
                className={cn(
                  'flex items-start gap-2 rounded-lg px-4 py-3 text-sm',
                  syncStatus === 'success'
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                )}
              >
                {syncStatus === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <div className="flex flex-col gap-1">
                  <span>{syncMessage}</span>
                  {syncStatus === 'success' && (
                    <a
                      href={sheetsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline underline-offset-2 opacity-80 hover:opacity-100"
                    >
                      スプレッドシートで確認する
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
