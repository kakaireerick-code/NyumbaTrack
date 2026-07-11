import React, { useState } from 'react'
import { Download, Upload, FileSpreadsheet, FileText } from 'lucide-react'
import GuidancePanel from '../components/GuidancePanel'
import { getPageGuidance } from '../lib/actionGuidance'
import { CSV_TEMPLATE } from '../lib/tenantData'
import { buildImportPreview, commitImport } from '../lib/spreadsheetImport'
import {
  ACCEPT_IMPORT_TYPES,
  ACCEPT_AGREEMENT_TYPES,
  readImportFileAsText,
  prepareImportText,
} from '../lib/fileImport'
import { storeAgreementFile } from '../lib/documentStorage'
import { scanAgreementDocument } from '../lib/agreementScan'
import { commitAgreementImport } from '../lib/agreementImport'
import { downloadText } from '../utils/helpers'
import { Badge, EmptyState, LoadingButton } from '../components/UI'

const STATUS_COLOR = { ok: 'green', review: 'orange', error: 'red' }

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
  const [tab, setTab] = useState('spreadsheet')
  const [preview, setPreview] = useState(null)
  const [agreementPreview, setAgreementPreview] = useState(null)
  const [fileName, setFileName] = useState('')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)

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

  const handleSpreadsheetFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setSummary(null)
    setAgreementPreview(null)
    try {
      const raw = await readImportFileAsText(file)
      const text = prepareImportText(file.name, raw)
      const built = buildImportPreview(text)
      setPreview(built)
      if (built.rows.length === 0) {
        showToast?.('No data rows found. Check headers or try Excel .xlsx / CSV.', 'error')
      }
    } catch {
      showToast?.('Could not read file.', 'error')
    }
    e.target.value = ''
  }

  const handleAgreementFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setScanning(true)
    setSummary(null)
    setPreview(null)
    const rows = []
    try {
      for (const file of files) {
        const document = await storeAgreementFile(file)
        const { scan } = await scanAgreementDocument(file, document)
        rows.push({ fileName: file.name, scan, document })
      }
      setAgreementPreview({ rows })
      setFileName(`${files.length} agreement(s)`)
      if (!rows.length) showToast?.('No files processed', 'error')
    } catch (err) {
      showToast?.(err.message || 'Could not scan agreements', 'error')
    }
    setScanning(false)
    e.target.value = ''
  }

  const handleSpreadsheetCommit = () => {
    if (!preview?.rows?.length) return
    setLoading(true)
    setTimeout(() => {
      const result = commitImport(preview, { buildings, units, tenants }, fileName || 'import.csv')
      applyImportResult(result, fileName || 'import.csv')
      setPreview(null)
      setLoading(false)
    }, 300)
  }

  const handleAgreementCommit = () => {
    if (!agreementPreview?.rows?.length) return
    setLoading(true)
    setTimeout(() => {
      const result = commitAgreementImport(agreementPreview, { buildings, units, tenants })
      applyImportResult(result, fileName || 'agreements')
      setAgreementPreview(null)
      setLoading(false)
    }, 300)
  }

  const applyImportResult = (result, sourceName) => {
    setBuildings(result.buildings)
    setUnits(result.units)
    setTenants(result.tenants)
    setImportHistory?.((prev) => [
      {
        id: `imp-${Date.now()}`,
        fileName: sourceName,
        importedAt: new Date().toISOString(),
        linked: result.linked,
        updated: result.updated,
        needsReview: result.needsReview,
        kind: tab,
      },
      ...(prev || []),
    ])
    setSummary(result)
    showToast?.(
      `${result.linked} tenants linked, ${result.updated} updated${result.needsReview ? `, ${result.needsReview} need review` : ''}`,
      'success',
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="text-brand" size={28} />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Data Import</h1>
          <p className="text-sm text-gray-500">Spreadsheets or bulk PDF/Word tenancy agreements</p>
        </div>
      </div>

      <GuidancePanel guidance={guidance} />

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setTab('spreadsheet')}
          className={`tap-target px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'spreadsheet' ? 'border-brand text-brand' : 'border-transparent text-gray-500'
          }`}
        >
          Spreadsheet
        </button>
        <button
          type="button"
          onClick={() => setTab('agreements')}
          className={`tap-target px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-1 ${
            tab === 'agreements' ? 'border-brand text-brand' : 'border-transparent text-gray-500'
          }`}
        >
          <FileText size={16} /> Agreements (PDF / Word)
        </button>
      </div>

      {tab === 'spreadsheet' && (
        <>
          <div className="card p-4 flex flex-wrap gap-3">
            <button type="button" onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 border rounded text-sm tap-target">
              <Download size={16} /> Download sample template
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded text-sm cursor-pointer tap-target">
              <Upload size={16} /> Upload Excel / CSV / TSV
              <input type="file" accept={ACCEPT_IMPORT_TYPES} className="hidden" onChange={handleSpreadsheetFile} />
            </label>
          </div>
          <p className="text-xs text-gray-400">
            Supports .xlsx, .csv, .tsv, and Word saved as .txt. Column mapping is automatic from headers.
          </p>
        </>
      )}

      {tab === 'agreements' && (
        <>
          <div className="card p-4 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload <strong>one tenant per file</strong>. We scan for name, unit, property, rent, deposit, phone, and lease dates, then attach the document to each tenant.
            </p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 tap-target">
              <Upload className="text-brand mb-2" size={28} />
              <span className="text-sm font-medium">Drop or select multiple PDF / .docx files</span>
              <span className="text-xs text-gray-400 mt-1">Text-based PDFs work best — image-only scans need OCR (coming later)</span>
              <input
                type="file"
                accept={ACCEPT_AGREEMENT_TYPES}
                multiple
                className="hidden"
                onChange={handleAgreementFiles}
              />
            </label>
            {scanning && <p className="text-sm text-gray-500">Scanning agreements…</p>}
          </div>
        </>
      )}

      {summary && (
        <div className="card p-4 border-l-4 border-green-500 space-y-2">
          <h2 className="font-semibold">Import complete</h2>
          <p className="text-sm">
            <strong>{summary.linked}</strong> tenants linked, <strong>{summary.updated}</strong> updated
            {summary.needsReview > 0 && (
              <>, <strong className="text-orange-600">{summary.needsReview}</strong> need review</>
            )}
          </p>
          {summary.needsReview > 0 && (
            <button type="button" onClick={() => setCurrentPage?.('tenants')} className="text-sm text-brand underline tap-target">
              Review tenants →
            </button>
          )}
        </div>
      )}

      {tab === 'spreadsheet' && preview && preview.rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="font-semibold">Preview — {fileName}</h2>
            <LoadingButton
              loading={loading}
              onClick={handleSpreadsheetCommit}
              className="px-4 py-2 bg-brand text-white rounded text-sm"
            >
              Confirm import
            </LoadingButton>
          </div>
          <p className="text-xs text-gray-500">
            Mapped columns: {Object.keys(preview.mappedColumns).join(', ') || 'none — check headers'}
          </p>
          <PreviewTable
            rows={preview.rows.map((row) => ({
              key: `import-row-${row.rowIndex}`,
              fileName: '',
              tenantName: row.tenantName,
              unitLabel: row.unitLabel,
              propertyName: row.propertyName,
              monthlyRent: row.monthlyRent,
              status: row.status,
              errors: row.errors,
              warnings: row.warnings,
            }))}
          />
        </div>
      )}

      {tab === 'agreements' && agreementPreview && agreementPreview.rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="font-semibold">Agreement preview — {fileName}</h2>
            <LoadingButton
              loading={loading}
              onClick={handleAgreementCommit}
              className="px-4 py-2 bg-brand text-white rounded text-sm"
            >
              Confirm import
            </LoadingButton>
          </div>
          <PreviewTable
            rows={agreementPreview.rows.map((row) => ({
              key: row.fileName,
              fileName: row.fileName,
              tenantName: row.scan.tenantName,
              unitLabel: row.scan.unitLabel,
              propertyName: row.scan.propertyName,
              monthlyRent: row.scan.monthlyRent,
              status: row.scan.status,
              errors: row.scan.errors,
              warnings: row.scan.warnings,
            }))}
          />
        </div>
      )}

      {tab === 'spreadsheet' && !preview && !summary && (
        <EmptyState message="Download the template, fill your tenant list, then upload Excel or CSV." />
      )}
      {tab === 'agreements' && !agreementPreview && !summary && !scanning && (
        <EmptyState message="Upload PDF or Word (.docx) agreements — one tenant per file." />
      )}
    </div>
  )
}

function PreviewTable({ rows }) {
  return (
    <div className="card table-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="p-2">File</th>
            <th className="p-2">Tenant</th>
            <th className="p-2">Unit</th>
            <th className="p-2">Property</th>
            <th className="p-2">Rent</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b last:border-0">
              <td className="p-2 text-xs truncate max-w-[120px]">{row.fileName || '—'}</td>
              <td className="p-2">{row.tenantName || <span className="text-gray-400">pending</span>}</td>
              <td className="p-2">{row.unitLabel || '—'}</td>
              <td className="p-2">{row.propertyName || '—'}</td>
              <td className="p-2">{row.monthlyRent ? row.monthlyRent.toLocaleString() : '—'}</td>
              <td className="p-2">
                <Badge color={STATUS_COLOR[row.status]}>{row.status}</Badge>
                {row.errors?.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">{row.errors.join('; ')}</p>
                )}
                {row.warnings?.length > 0 && (
                  <p className="text-xs text-orange-600 mt-1">{row.warnings.join('; ')}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
