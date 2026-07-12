import React, { useState, useMemo } from 'react'
import { Download, Upload, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react'
import GuidancePanel from '../components/GuidancePanel'
import { getPageGuidance } from '../lib/actionGuidance'
import { CSV_TEMPLATE } from '../lib/tenantData'
import {
  buildImportPreview,
  commitImport,
  IMPORT_COLUMNS,
  COLUMN_LABELS,
} from '../lib/spreadsheetImport'
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

const STEPS = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Map columns' },
  { id: 3, label: 'Preview' },
  { id: 4, label: 'Confirm' },
]

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
  const [importText, setImportText] = useState('')
  const [columnMapping, setColumnMapping] = useState({})
  const [headers, setHeaders] = useState([])
  const [agreementPreview, setAgreementPreview] = useState(null)
  const [fileName, setFileName] = useState('')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const guidance = getPageGuidance(currentRole, 'data-import', {
    buildings,
    units,
    tenants,
    selectedBuilding,
  })

  const preview = useMemo(() => {
    if (!importText) return null
    return buildImportPreview(importText, columnMapping)
  }, [importText, columnMapping])

  const currentStep = !importText ? 1 : preview?.rows?.length ? 3 : 2

  const downloadTemplate = () => {
    downloadText('nyumbatrack-tenant-import-template.csv', CSV_TEMPLATE)
    showToast?.('Template downloaded', 'success')
  }

  const loadSpreadsheetFile = async (file) => {
    if (!file) return
    setFileName(file.name)
    setSummary(null)
    setAgreementPreview(null)
    try {
      const raw = await readImportFileAsText(file)
      const text = prepareImportText(file.name, raw)
      const built = buildImportPreview(text)
      setImportText(text)
      setColumnMapping(built.mappedColumns)
      setHeaders(built.headers)
      if (built.rows.length === 0) {
        showToast?.('No data rows found. Check headers or try Excel .xlsx / CSV.', 'error')
      }
    } catch (err) {
      showToast?.(err.message || 'Could not read file.', 'error')
    }
  }

  const handleSpreadsheetFile = async (e) => {
    await loadSpreadsheetFile(e.target.files?.[0])
    e.target.value = ''
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragOver(false)
    if (tab !== 'spreadsheet') return
    const file = e.dataTransfer.files?.[0]
    await loadSpreadsheetFile(file)
  }

  const handleMappingChange = (key, headerIndex) => {
    const next = { ...columnMapping }
    if (headerIndex === '' || headerIndex === undefined) {
      delete next[key]
    } else {
      next[key] = Number(headerIndex)
    }
    setColumnMapping(next)
  }

  const handleAgreementFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setScanning(true)
    setSummary(null)
    setImportText('')
    const rows = []
    try {
      for (const file of files) {
        const document = await storeAgreementFile(file)
        const { scan } = await scanAgreementDocument(file, document)
        rows.push({ fileName: file.name, scan, document })
      }
      setAgreementPreview({ rows })
      setFileName(`${files.length} agreement(s)`)
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
      setImportText('')
      setColumnMapping({})
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
          <p className="text-sm text-gray-500">ULTT-style spreadsheet import + optional agreement scan</p>
        </div>
      </div>

      <GuidancePanel guidance={guidance} />

      <div className="card p-4 border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20 space-y-2">
        <p className="font-semibold text-blue-900 dark:text-blue-100">Can&apos;t import your file?</p>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          If a spreadsheet, PDF, or Word document won&apos;t upload or map correctly, improvise and carry on — you
          don&apos;t need import to use NyumbaTrack.
        </p>
        <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc pl-5 space-y-1">
          <li>
            <strong>Properties & units</strong> — add them from Buildings and Units
          </li>
          <li>
            <strong>Tenants</strong> — use Quick add on any unit, or share an invite link
          </li>
          <li>
            <strong>Agreements</strong> — attach PDFs later from a tenant profile or Documents
          </li>
        </ul>
        {setCurrentPage && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCurrentPage('buildings')}
              className="text-sm text-brand underline tap-target"
            >
              Buildings →
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('units')}
              className="text-sm text-brand underline tap-target"
            >
              Units →
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('tenants')}
              className="text-sm text-brand underline tap-target"
            >
              Tenants →
            </button>
          </div>
        )}
      </div>

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
          <div className="flex flex-wrap gap-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${
                  currentStep >= step.id
                    ? 'bg-brand/10 text-brand font-medium'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}
              >
                {currentStep > step.id ? <CheckCircle2 size={14} /> : <span className="font-bold">{step.id}</span>}
                {step.label}
              </div>
            ))}
          </div>

          <div
            className={`card p-6 border-2 border-dashed transition-colors ${
              dragOver ? 'border-brand bg-brand/5' : 'border-gray-200 dark:border-gray-700'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="flex flex-wrap gap-3 justify-center">
              <button type="button" onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 border rounded text-sm tap-target">
                <Download size={16} /> Download template
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded text-sm cursor-pointer tap-target">
                <Upload size={16} /> Pick file
                <input type="file" accept={ACCEPT_IMPORT_TYPES} className="hidden" onChange={handleSpreadsheetFile} />
              </label>
            </div>
            <p className="text-center text-sm text-gray-500 mt-3">
              Drag-and-drop <strong>.xlsx</strong>, <strong>.csv</strong>, <strong>.tsv</strong>, or Word saved as <strong>Plain Text (.txt)</strong>
            </p>
            <p className="text-center text-xs text-amber-700 dark:text-amber-300 mt-2">
              PDF and .docx are not accepted here — copy tables to Excel, save Word as .txt, or use the Agreements tab.
            </p>
          </div>
        </>
      )}

      {tab === 'agreements' && (
        <div className="card p-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bulk scan: upload <strong>one tenant per PDF or .docx</strong>. For tabular Word lists, copy to Excel and use the Spreadsheet tab.
          </p>
          <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 tap-target">
            <Upload className="text-brand mb-2" size={28} />
            <span className="text-sm font-medium">Drop or select multiple PDF / .docx files</span>
            <input type="file" accept={ACCEPT_AGREEMENT_TYPES} multiple className="hidden" onChange={handleAgreementFiles} />
          </label>
          {scanning && <p className="text-sm text-gray-500">Scanning agreements…</p>}
        </div>
      )}

      {summary && (
        <div className="card p-4 border-l-4 border-green-500 space-y-2">
          <h2 className="font-semibold flex items-center gap-2"><CheckCircle2 size={18} className="text-green-600" /> Import complete</h2>
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

      {tab === 'spreadsheet' && importText && headers.length > 0 && (
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold text-sm">Map columns — {fileName}</h2>
          <p className="text-xs text-gray-500">Headers auto-aligned. Adjust any field using the dropdowns below.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {IMPORT_COLUMNS.map((key) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <label className="w-32 shrink-0 text-gray-600 dark:text-gray-400">{COLUMN_LABELS[key]}</label>
                <select
                  className="flex-1 border rounded px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
                  value={columnMapping[key] ?? ''}
                  onChange={(e) => handleMappingChange(key, e.target.value)}
                >
                  <option value="">— not mapped —</option>
                  {headers.map((h, idx) => (
                    <option key={`${key}-${idx}`} value={idx}>{h || `Column ${idx + 1}`}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'spreadsheet' && preview && preview.rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="font-semibold">Preview — {preview.rows.length} row(s)</h2>
            <LoadingButton loading={loading} onClick={handleSpreadsheetCommit} className="px-4 py-2 bg-brand text-white rounded text-sm">
              Confirm import
            </LoadingButton>
          </div>
          <PreviewTable
            rows={preview.rows.map((row) => ({
              key: `import-row-${row.rowIndex}`,
              fileName: '',
              tenantName: row.tenantName,
              unitLabel: row.unitLabel,
              propertyName: row.propertyName,
              monthlyRent: row.monthlyRent,
              phone: row.phone,
              status: row.status,
              errors: row.errors,
              warnings: row.warnings,
            }))}
            showPhone
          />
        </div>
      )}

      {tab === 'agreements' && agreementPreview && agreementPreview.rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="font-semibold">Agreement preview — {fileName}</h2>
            <LoadingButton loading={loading} onClick={handleAgreementCommit} className="px-4 py-2 bg-brand text-white rounded text-sm">
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

      {tab === 'spreadsheet' && !importText && !summary && (
        <EmptyState message="Download the template, fill your tenant list, then upload Excel (.xlsx) or CSV." />
      )}
      {tab === 'agreements' && !agreementPreview && !summary && !scanning && (
        <EmptyState message="Upload PDF or Word (.docx) agreements — one tenant per file." />
      )}
    </div>
  )
}

function PreviewTable({ rows, showPhone = false }) {
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
            {showPhone && <th className="p-2">Phone</th>}
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
              {showPhone && <td className="p-2 text-xs">{row.phone || '—'}</td>}
              <td className="p-2">
                <Badge color={STATUS_COLOR[row.status]}>{row.status}</Badge>
                {row.errors?.length > 0 && <p className="text-xs text-red-600 mt-1">{row.errors.join('; ')}</p>}
                {row.warnings?.length > 0 && <p className="text-xs text-orange-600 mt-1">{row.warnings.join('; ')}</p>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
