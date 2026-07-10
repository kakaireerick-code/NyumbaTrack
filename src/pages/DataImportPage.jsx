import React, { useState } from 'react'
import { Download, Upload, FileSpreadsheet } from 'lucide-react'
import GuidancePanel from '../components/GuidancePanel'
import { getPageGuidance } from '../lib/actionGuidance'
import { CSV_TEMPLATE } from '../lib/tenantData'
import {
  buildImportPreview,
  commitImport,
} from '../lib/spreadsheetImport'
import { downloadText } from '../utils/helpers'
import { Badge, EmptyState } from '../components/UI'

export default function DataImportPage({
  currentRole,
  buildings,
  units,
  tenants,
  selectedBuilding,
  setBuildings,
  setUnits,
  setTenants,
  setImportHistory,
  showToast,
  setCurrentPage,
}) {
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState('')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)

  const guidance = getPageGuidance(currentRole, 'data-import', {
    buildings,
    units,
    tenants,
    selectedBuilding,
  })

  const downloadTemplate = () => {
    downloadText('nyumbatrack-tenant-import-template.csv', CSV_TEMPLATE)
    showToast?.('Template downloaded', 'success')
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setSummary(null)
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      const built = buildImportPreview(text)
      setPreview(built)
      if (built.rows.length === 0) {
        showToast?.('No data rows found. Check your CSV format.', 'error')
      }
    }
    reader.readAsText(file)
  }

  const handleCommit = () => {
    if (!preview?.rows?.length) return
    setLoading(true)
    setTimeout(() => {
      const result = commitImport(
        preview,
        { buildings, units, tenants },
        fileName || 'import.csv',
      )
      setBuildings(result.buildings)
      setUnits(result.units)
      setTenants(result.tenants)
      setImportHistory?.((prev) => [
        {
          id: `imp-${Date.now()}`,
          fileName: fileName || 'import.csv',
          importedAt: new Date().toISOString(),
          linked: result.linked,
          updated: result.updated,
          needsReview: result.needsReview,
        },
        ...(prev || []),
      ])
      setSummary(result)
      setPreview(null)
      showToast?.(
        `${result.linked} tenants linked, ${result.updated} updated${result.needsReview ? `, ${result.needsReview} need review` : ''}`,
        'success',
      )
      setLoading(false)
    }, 300)
  }

  const statusColor = { ok: 'green', review: 'orange', error: 'red' }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="text-[#2d6a4f]" size={28} />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Data Import</h1>
          <p className="text-sm text-gray-500">Upload tenants from Excel or Google Sheets (save as CSV)</p>
        </div>
      </div>

      <GuidancePanel guidance={guidance} />

      <div className="card p-4 flex flex-wrap gap-3">
        <button type="button" onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 border rounded text-sm">
          <Download size={16} /> Download sample template
        </button>
        <label className="flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] text-white rounded text-sm cursor-pointer">
          <Upload size={16} /> Upload CSV
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        </label>
      </div>

      <p className="text-xs text-gray-400">
        Tip: On mobile, quick-add works great. Save spreadsheet import for desktop.
      </p>

      {summary && (
        <div className="card p-4 border-l-4 border-green-500 space-y-2">
          <h2 className="font-semibold">Import complete</h2>
          <p className="text-sm">
            <strong>{summary.linked}</strong> tenants linked, <strong>{summary.updated}</strong> updated
            {summary.needsReview > 0 && (
              <>, <strong className="text-orange-600">{summary.needsReview}</strong> rows need your review</>
            )}
          </p>
          {summary.needsReview > 0 && (
            <button type="button" onClick={() => setCurrentPage?.('tenants')} className="text-sm text-[#2d6a4f] underline">
              Review tenants →
            </button>
          )}
        </div>
      )}

      {preview && preview.rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Preview — {fileName}</h2>
            <button
              type="button"
              disabled={loading}
              onClick={handleCommit}
              className="px-4 py-2 bg-[#2d6a4f] text-white rounded text-sm disabled:opacity-50"
            >
              {loading ? 'Importing…' : 'Confirm import'}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Mapped columns: {Object.keys(preview.mappedColumns).join(', ') || 'none — check headers'}
          </p>
          <div className="card table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="p-2">#</th>
                  <th className="p-2">Tenant</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2">Property</th>
                  <th className="p-2">Rent</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={`import-row-${row.rowIndex}`} className="border-b last:border-0">
                    <td className="p-2">{row.rowIndex}</td>
                    <td className="p-2">{row.tenantName || <span className="text-gray-400">pending</span>}</td>
                    <td className="p-2">{row.unitLabel}</td>
                    <td className="p-2">{row.propertyName}</td>
                    <td className="p-2">{row.monthlyRent ? row.monthlyRent.toLocaleString() : '—'}</td>
                    <td className="p-2">
                      <Badge color={statusColor[row.status]}>{row.status}</Badge>
                      {row.errors.length > 0 && (
                        <p className="text-xs text-red-600 mt-1">{row.errors.join('; ')}</p>
                      )}
                      {row.warnings.length > 0 && (
                        <p className="text-xs text-orange-600 mt-1">{row.warnings.join('; ')}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!preview && !summary && (
        <EmptyState message="Download the template, fill your tenant list, then upload the CSV file." />
      )}
    </div>
  )
}
