import { useMemo } from 'react'
import type { CsvFile } from '@/components/csv-uploader'

export interface MergedData {
  headers: string[]
  rows: string[][]
  totalRows: number
}

function parseCsv(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '')
  return lines.map((line) => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  })
}

export function useMergedCsv(files: CsvFile[]): MergedData | null {
  return useMemo(() => {
    if (files.length === 0) return null

    const allParsed = files.map((f) => parseCsv(f.content))
    const headers = allParsed[0]?.[0] ?? []
    const rows: string[][] = []

    allParsed.forEach((parsed, index) => {
      const dataRows = index === 0 ? parsed.slice(1) : parsed.slice(1)
      rows.push(...dataRows)
    })

    return { headers, rows, totalRows: rows.length }
  }, [files])
}
