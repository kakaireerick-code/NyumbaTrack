/** Pure CSS/SVG bar chart — no recharts */

export default function SimpleBarChart({ data, labelKey = 'label', valueKey = 'value', color = '#2d6a4f', maxValue }) {
  if (!data?.length) return null

  const max = maxValue || Math.max(...data.map((d) => d[valueKey] || 0), 1)

  return (
    <div className="space-y-2" role="img" aria-label="Bar chart">
      {data.map((item) => {
        const val = item[valueKey] || 0
        const pct = Math.round((val / max) * 100)
        return (
          <div key={String(item[labelKey])}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="truncate pr-2">{String(item[labelKey])}</span>
              <span className="font-medium shrink-0">{typeof val === 'number' && val > 1000 ? `UGX ${val.toLocaleString()}` : String(val)}</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
