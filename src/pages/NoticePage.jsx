import React from 'react'
import { getNoticeById } from '../lib/noticeStore'
import { buildNoticeWordDocument, downloadNoticeDocument, openNoticeInWord } from '../utils/notices'
import { canViewField, normalizeRole, canAccessPage } from '../lib/permissions'
import { fmtDate } from '../utils/helpers'

export default function NoticePage({ noticeId, currentRole, authUser, onClose }) {
  const role = normalizeRole(currentRole || '')
  const snapshot = getNoticeById(noticeId)

  if (!snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
        <div className="card p-8 text-center max-w-md">
          <h1 className="text-lg font-bold mb-2">Notice not found</h1>
          <p className="text-sm text-gray-500 mb-4">This notice may have been removed or the link is invalid.</p>
          {onClose && (
            <button type="button" className="px-4 py-2 bg-[#2d6a4f] text-white rounded" onClick={onClose}>
              Go back
            </button>
          )}
        </div>
      </div>
    )
  }

  if (normalizeRole(role) === 'tenant' && authUser?.tenantId && snapshot.tenantId !== authUser.tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
        <div className="card p-8 text-center max-w-md">
          <p className="text-sm text-gray-600">You do not have access to this notice.</p>
        </div>
      </div>
    )
  }

  if (!canAccessPage(role, 'notice-view') || !canViewField(role, 'notice.body')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
        <div className="card p-8 text-center max-w-md">
          <p className="text-sm text-gray-600">You do not have access to this document.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#e8ebe9] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div
          className="card p-6 select-none bg-white dark:bg-gray-900"
          contentEditable={false}
          suppressContentEditableWarning
          aria-label={`Legal notice ${snapshot.noticeNo}`}
        >
          <p className="text-[10px] uppercase tracking-widest text-[#2d6a4f] font-bold text-center mb-2">
            Official legal notice · Read only
          </p>
          <h1 className="text-xl font-bold text-center mb-1">{snapshot.type}</h1>
          <p className="text-center font-mono text-sm text-gray-500 mb-4">{snapshot.noticeNo}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm mb-6">
            <div><dt className="text-xs text-gray-400 uppercase">Date</dt><dd>{fmtDate(snapshot.servedAt)}</dd></div>
            <div><dt className="text-xs text-gray-400 uppercase">To</dt><dd>{snapshot.tenantName}</dd></div>
            <div><dt className="text-xs text-gray-400 uppercase">Unit</dt><dd>{snapshot.unitNumber}</dd></div>
            <div><dt className="text-xs text-gray-400 uppercase">Property</dt><dd>{snapshot.propertyName}</dd></div>
            <div><dt className="text-xs text-gray-400 uppercase">Served by</dt><dd>{snapshot.servedBy}</dd></div>
            {snapshot.followUpDate ? (
              <div><dt className="text-xs text-gray-400 uppercase">Follow-up</dt><dd>{fmtDate(snapshot.followUpDate)}</dd></div>
            ) : null}
          </dl>
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
            {snapshot.body}
          </pre>
          <p className="text-xs text-center text-gray-400 mt-4">
            Issued by {snapshot.issuedBy} · Not editable by recipient
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mt-4 no-print">
          <button
            type="button"
            className="px-4 py-2.5 bg-[#2d6a4f] text-white rounded-lg text-sm"
            onClick={() => openNoticeInWord(snapshot)}
          >
            Open in Word
          </button>
          <button
            type="button"
            className="px-4 py-2.5 border rounded-lg text-sm"
            onClick={() => downloadNoticeDocument(snapshot)}
          >
            Save copy
          </button>
          {onClose && (
            <button type="button" className="px-4 py-2.5 border rounded-lg text-sm text-gray-500" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
