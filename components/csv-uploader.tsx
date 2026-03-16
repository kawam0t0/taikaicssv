'use client'

import { useCallback, useRef, useState } from 'react'
import { UploadCloud, X, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface CsvFile {
  id: string
  name: string
  size: number
  content: string
}

interface CsvUploaderProps {
  files: CsvFile[]
  onFilesChange: (files: CsvFile[]) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function CsvUploader({ files, onFilesChange }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const readFile = (file: File): Promise<CsvFile> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          content: e.target?.result as string,
        })
      }
      reader.onerror = () => reject(new Error(`${file.name} の読み込みに失敗しました`))
      reader.readAsText(file, 'UTF-8')
    })

  const processFiles = useCallback(
    async (newFiles: File[]) => {
      setError(null)
      const csvFiles = newFiles.filter((f) => f.name.endsWith('.csv'))
      if (csvFiles.length !== newFiles.length) {
        setError('CSVファイル以外はアップロードできません')
      }
      if (csvFiles.length === 0) return

      try {
        const parsed = await Promise.all(csvFiles.map(readFile))
        const existingNames = new Set(files.map((f) => f.name))
        const unique = parsed.filter((f) => !existingNames.has(f.name))
        if (unique.length < parsed.length) {
          setError('同名のファイルはスキップされました')
        }
        onFilesChange([...files, ...unique])
      } catch (e) {
        setError(e instanceof Error ? e.message : '読み込みエラーが発生しました')
      }
    },
    [files, onFilesChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      processFiles(Array.from(e.dataTransfer.files))
    },
    [processFiles]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors select-none',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5'
        )}
      >
        <div className={cn(
          'flex items-center justify-center w-12 h-12 rounded-full transition-colors',
          isDragging ? 'bg-primary/20' : 'bg-secondary'
        )}>
          <UploadCloud className={cn('w-6 h-6 transition-colors', isDragging ? 'text-primary' : 'text-muted-foreground')} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            CSVファイルをドロップ、または
            <span className="text-primary"> クリックして選択</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">UTF-8 形式のCSVファイル（複数選択可）</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((file, index) => (
            <li
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground shrink-0">
                  {index === 0 ? 'ヘッダー使用' : 'ヘッダー除外'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFile(file.id)}
                  aria-label={`${file.name} を削除`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
