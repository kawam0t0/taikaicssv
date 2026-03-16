'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, TableProperties } from 'lucide-react'
import type { MergedData } from '@/hooks/use-merged-csv'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

interface MergedPreviewProps {
  data: MergedData
}

export function MergedPreview({ data }: MergedPreviewProps) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(data.rows.length / PAGE_SIZE))
  const start = (page - 1) * PAGE_SIZE
  const visibleRows = data.rows.slice(start, start + PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TableProperties className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            マージプレビュー
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {data.totalRows} 行 / {data.headers.length} 列
        </span>
      </div>

      <div className="rounded-xl border border-border overflow-auto max-h-80">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-secondary sticky top-0">
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground border-b border-border w-10 shrink-0">
                #
              </th>
              {data.headers.map((header, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left text-xs font-semibold text-secondary-foreground border-b border-border whitespace-nowrap"
                >
                  {header || `列${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  'transition-colors',
                  rowIndex % 2 === 0 ? 'bg-card' : 'bg-muted/20',
                  'hover:bg-accent/40'
                )}
              >
                <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums border-b border-border/50">
                  {start + rowIndex + 1}
                </td>
                {data.headers.map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-3 py-2 text-xs text-foreground border-b border-border/50 whitespace-nowrap max-w-48 overflow-hidden text-ellipsis"
                  >
                    {row[colIndex] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages} ページ
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="前のページ"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="次のページ"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
