import { useState, useEffect } from 'react'

export default function ComplianceReport() {
  const [flocks, setFlocks] = useState([])
  const [vaccinations, setVaccinations] = useState([])
  const [medicines, setMedicines] = useState([])
  const [logs, setLogs] = useState([])

  useEffect(() => {
    try { setFlocks(JSON.parse(localStorage.getItem('clucktrack_flocks') || '[]')) } catch { setFlocks([]) }
    try { setVaccinations(JSON.parse(localStorage.getItem('clucktrack_vaccinations') || '[]')) } catch { setVaccinations([]) }
    try { setMedicines(JSON.parse(localStorage.getItem('clucktrack_medicinelog') || '[]')) } catch { setMedicines([]) }
    try { setLogs(JSON.parse(localStorage.getItem('clucktrack_logs') || '[]')) } catch { setLogs([]) }
  }, [])

  const totalDeaths = logs.reduce((sum, log) => sum + (log.deaths || 0), 0)
  const totalEggs = logs.reduce((sum, log) => sum + (log.eggs || 0), 0)
  const totalBirds = flocks.reduce((sum, f) => sum + (f.count || 0), 0)

  const handlePrint = () => {
    const reportDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    })

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CluckTrack Compliance Report</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 20px; }
          h1 { font-size: 20px; color: #8B6F47; border-bottom: 2px solid #E8956D; padding-bottom: 8px; }
          h2 { font-size: 14px; color: #8B6F47; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
          th { background: #E8956D; color: white; padding: 6px 8px; text-align: left; }
          td { padding: 5px 8px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) td { background: #fafafa; }
          .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11px; color: #666; }
          .summary { background: #f5f5f5; padding: 10px; border-radius: 4px; margin: 10px 0; }
          .summary span { margin-right: 20px; font-weight: bold; }
          @media print { body { margin: 10px; } }
        </style>
      </head>
      <body>
        <h1>🐔 CluckTrack — Compliance Report</h1>
        <div class="header-info">
          <span>Generated: ${reportDate}</span>
          <span>Total Flocks: ${flocks.length} | Total Birds: ${totalBirds}</span>
        </div>

        <div class="summary">
          <span>Total Eggs Collected: ${totalEggs}</span>
          <span>Total Deaths: ${totalDeaths}</span>
          <span>Vaccinations: ${vaccinations.length}</span>
          <span>Medicine Records: ${medicines.length}</span>
        </div>

        <h2>1. Flock Records</h2>
        <table>
          <thead>
            <tr><th>Flock Name</th><th>Breed</th><th>Birds</th><th>Pen</th><th>Date Started</th></tr>
          </thead>
          <tbody>
            ${flocks.length === 0 ? '<tr><td colspan="5">No flocks recorded</td></tr>' :
              flocks.map(f => `
                <tr>
                  <td>${f.name}</td>
                  <td>${f.breed}</td>
                  <td>${f.count}</td>
                  <td>${f.penNumber || '-'}</td>
                  <td>${new Date(f.dateAdded).toLocaleDateString('en-IN')}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>

        <h2>2. Vaccination Records</h2>
        <table>
          <thead>
            <tr><th>Vaccine</th><th>Flock</th><th>Due Date</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${vaccinations.length === 0 ? '<tr><td colspan="4">No vaccinations recorded</td></tr>' :
              vaccinations.map(v => `
                <tr>
                  <td>${v.name}</td>
                  <td>${v.flock}</td>
                  <td>${new Date(v.dueDate + 'T00:00:00').toLocaleDateString('en-IN')}</td>
                  <td>${v.status === 'completed' ? '✓ Completed' : 'Pending'}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>

        <h2>3. Medicine Log</h2>
        <table>
          <thead>
            <tr><th>Medicine</th><th>Flock</th><th>Dosage</th><th>Date Given</th><th>Batch No.</th><th>Withdrawal (days)</th></tr>
          </thead>
          <tbody>
            ${medicines.length === 0 ? '<tr><td colspan="6">No medicines recorded</td></tr>' :
              medicines.map(m => `
                <tr>
                  <td>${m.name}</td>
                  <td>${m.flockName}</td>
                  <td>${m.dosage}</td>
                  <td>${new Date(m.dateGiven).toLocaleDateString('en-IN')}</td>
                  <td>${m.batchNumber || '-'}</td>
                  <td>${m.withdrawalDays || 0}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>

        <h2>4. Mortality Records (Last 30 Days)</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Deaths</th><th>Eggs</th><th>Feed (kg)</th><th>Notes</th></tr>
          </thead>
          <tbody>
            ${(() => {
              const thirtyDaysAgo = new Date()
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
              const recentLogs = logs.filter(l => new Date(l.date) >= thirtyDaysAgo && l.deaths > 0)
              return recentLogs.length === 0
                ? '<tr><td colspan="5">No mortality events in last 30 days</td></tr>'
                : recentLogs.map(l => `
                    <tr>
                      <td>${new Date(l.date).toLocaleDateString('en-IN')}</td>
                      <td style="color:red;font-weight:bold">${l.deaths}</td>
                      <td>${l.eggs}</td>
                      <td>${l.feed}</td>
                      <td>${l.notes || '-'}</td>
                    </tr>
                  `).join('')
            })()}
          </tbody>
        </table>

        <br/><br/>
        <p style="font-size:10px;color:#999;text-align:center">
          This report was generated by CluckTrack Farm Management System on ${reportDate}.<br/>
          For official purposes, please have this document signed by the farm manager.
        </p>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text)]">Compliance Report</h1>
        <p className="text-[var(--text-muted)] text-sm">Generate PDF for government inspection</p>
      </div>

      {/* Report Preview */}
      <div className="space-y-4 mb-6">
        {/* Summary Card */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <h3 className="font-bold text-[var(--text)] mb-3">📊 Report Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-[var(--surface)] p-3 rounded">
              <p className="text-[var(--text-muted)] text-xs">Flocks</p>
              <p className="text-2xl font-bold text-blue-600">{flocks.length}</p>
            </div>
            <div className="bg-[var(--surface)] p-3 rounded">
              <p className="text-[var(--text-muted)] text-xs">Total Birds</p>
              <p className="text-2xl font-bold text-blue-600">{totalBirds}</p>
            </div>
            <div className="bg-[var(--surface)] p-3 rounded">
              <p className="text-[var(--text-muted)] text-xs">Vaccinations</p>
              <p className="text-2xl font-bold text-yellow-600">{vaccinations.length}</p>
            </div>
            <div className="bg-[var(--surface)] p-3 rounded">
              <p className="text-[var(--text-muted)] text-xs">Medicine Records</p>
              <p className="text-2xl font-bold text-purple-600">{medicines.length}</p>
            </div>
            <div className="bg-[var(--surface)] p-3 rounded">
              <p className="text-[var(--text-muted)] text-xs">Total Deaths (all time)</p>
              <p className="text-2xl font-bold text-red-600">{totalDeaths}</p>
            </div>
            <div className="bg-[var(--surface)] p-3 rounded">
              <p className="text-[var(--text-muted)] text-xs">Total Eggs (all time)</p>
              <p className="text-2xl font-bold text-yellow-500">{totalEggs}</p>
            </div>
          </div>
        </div>

        {/* What's included */}
        <div className="card border-l-4 border-farm-orange">
          <h3 className="font-bold text-[var(--text)] mb-3">📋 Report Includes</h3>
          <ul className="space-y-2 text-sm text-[var(--text)]">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> All flock records (breed, pen, date started)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Complete vaccination history
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Medicine log with batch numbers & withdrawal periods
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Mortality records (last 30 days)
            </li>
          </ul>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handlePrint}
        className="btn-primary w-full py-4 text-lg font-bold"
      >
        🖨️ Generate & Print PDF Report
      </button>

      <p className="text-center text-xs text-[var(--text-dim)] mt-3">
        A print dialog will open. Select "Save as PDF" to download.
      </p>
    </div>
  )
}
