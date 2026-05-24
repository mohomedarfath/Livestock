import { useState, useEffect } from 'react'

export default function WhatsAppAlerts() {
  const [flocks, setFlocks] = useState([])
  const [vaccinations, setVaccinations] = useState([])
  const [logs, setLogs] = useState([])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [savedPhone, setSavedPhone] = useState('')

  useEffect(() => {
    try { setFlocks(JSON.parse(localStorage.getItem('clucktrack_flocks') || '[]')) } catch { setFlocks([]) }
    try { setVaccinations(JSON.parse(localStorage.getItem('clucktrack_vaccinations') || '[]')) } catch { setVaccinations([]) }
    try { setLogs(JSON.parse(localStorage.getItem('clucktrack_logs') || '[]')) } catch { setLogs([]) }
    const saved = localStorage.getItem('clucktrack_whatsapp_phone') || ''
    setSavedPhone(saved)
    setPhoneNumber(saved)
  }, [])

  const savePhone = () => {
    if (phoneNumber.match(/^\d{10,15}$/)) {
      localStorage.setItem('clucktrack_whatsapp_phone', phoneNumber)
      setSavedPhone(phoneNumber)
    }
  }

  const sendWhatsApp = (message) => {
    const phone = savedPhone || phoneNumber
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank')
  }

  // Compute alerts
  const today = new Date().toISOString().split('T')[0]
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const upcomingVaccinations = vaccinations.filter(
    v => v.status === 'pending' && v.dueDate >= today && v.dueDate <= threeDaysFromNow
  )

  const overdueVaccinations = vaccinations.filter(
    v => v.status === 'pending' && v.dueDate < today
  )

  const todayLogs = logs.filter(l => l.date === today)
  const todayDeaths = todayLogs.reduce((sum, l) => sum + (l.deaths || 0), 0)
  const totalBirds = flocks.reduce((sum, f) => sum + (f.count || 0), 0)
  const mortalityRate = totalBirds > 0 ? ((todayDeaths / totalBirds) * 100).toFixed(2) : 0
  const highMortality = parseFloat(mortalityRate) >= 2

  // Weekly summary
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  })
  const weekLogs = logs.filter(l => last7Days.includes(l.date))
  const weekEggs = weekLogs.reduce((sum, l) => sum + (l.eggs || 0), 0)
  const weekDeaths = weekLogs.reduce((sum, l) => sum + (l.deaths || 0), 0)
  const weekFeed = weekLogs.reduce((sum, l) => sum + (l.feed || 0), 0).toFixed(1)

  const weeklySummaryMessage = `🐔 *CluckTrack Weekly Summary*
📅 Week: ${last7Days[6]} to ${last7Days[0]}

🥚 Eggs Collected: ${weekEggs}
💀 Deaths: ${weekDeaths}
🌾 Feed Used: ${weekFeed} kg
🐔 Total Birds: ${totalBirds} (${flocks.length} flocks)
💉 Pending Vaccinations: ${overdueVaccinations.length + upcomingVaccinations.length}

_Sent from CluckTrack Farm App_`

  const vaccinationAlertMessage = upcomingVaccinations.length > 0
    ? `⚠️ *Vaccination Due Soon!*\n\n${upcomingVaccinations.map(v =>
        `💉 ${v.name} for ${v.flock}\n📅 Due: ${new Date(v.dueDate + 'T00:00:00').toLocaleDateString('en-IN')}`
      ).join('\n\n')}\n\n_Sent from CluckTrack Farm App_`
    : null

  const mortalityAlertMessage = highMortality
    ? `🚨 *High Mortality Alert!*\n\nToday's mortality rate: ${mortalityRate}%\nDeaths today: ${todayDeaths} birds\nTotal birds: ${totalBirds}\n\n⚠️ Please investigate immediately!\n\n_Sent from CluckTrack Farm App_`
    : null

  const alerts = [
    {
      id: 'weekly',
      title: 'Weekly Summary',
      icon: '📊',
      desc: `This week: ${weekEggs} eggs, ${weekDeaths} deaths`,
      message: weeklySummaryMessage,
      color: 'blue',
      available: true,
    },
    {
      id: 'vaccination',
      title: 'Vaccination Due',
      icon: '💉',
      desc: upcomingVaccinations.length > 0
        ? `${upcomingVaccinations.length} vaccination(s) due within 3 days`
        : 'No upcoming vaccinations',
      message: vaccinationAlertMessage,
      color: 'yellow',
      available: upcomingVaccinations.length > 0,
    },
    {
      id: 'overdue-vac',
      title: 'Overdue Vaccinations',
      icon: '🔴',
      desc: overdueVaccinations.length > 0
        ? `${overdueVaccinations.length} vaccination(s) overdue`
        : 'No overdue vaccinations',
      message: overdueVaccinations.length > 0
        ? `🔴 *Overdue Vaccinations!*\n\n${overdueVaccinations.map(v =>
            `💉 ${v.name} for ${v.flock} — was due ${new Date(v.dueDate + 'T00:00:00').toLocaleDateString('en-IN')}`
          ).join('\n')}\n\n_Sent from CluckTrack Farm App_`
        : null,
      color: 'red',
      available: overdueVaccinations.length > 0,
    },
    {
      id: 'mortality',
      title: 'High Mortality Alert',
      icon: '⚠️',
      desc: highMortality
        ? `TODAY: ${mortalityRate}% mortality rate — above 2% threshold!`
        : `Today: ${mortalityRate}% mortality rate (below 2% threshold)`,
      message: mortalityAlertMessage,
      color: 'red',
      available: highMortality,
    },
  ]

  const colorClasses = {
    blue: { card: 'border-blue-400 bg-blue-50', btn: 'bg-blue-500 hover:bg-blue-600 text-white', badge: 'bg-blue-100 text-blue-800' },
    yellow: { card: 'border-yellow-400 bg-yellow-50', btn: 'bg-yellow-500 hover:bg-yellow-600 text-white', badge: 'bg-yellow-100 text-yellow-800' },
    red: { card: 'border-red-400 bg-red-50', btn: 'bg-red-500 hover:bg-red-600 text-white', badge: 'bg-red-100 text-red-800' },
    green: { card: 'border-green-400 bg-green-50', btn: 'bg-green-500 hover:bg-green-600 text-white', badge: 'bg-green-100 text-green-800' },
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text)]">WhatsApp Alerts</h1>
        <p className="text-[var(--text-muted)] text-sm">Send farm updates via WhatsApp</p>
      </div>

      {/* Phone Setup */}
      <div className="card border-2 border-green-400 bg-green-50 mb-6">
        <h3 className="font-bold text-green-900 mb-3">📱 Your WhatsApp Number</h3>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Country code + number (e.g. 94771234567)"
              className="input-field text-sm"
            />
            <p className="text-xs text-[var(--text-dim)] mt-1">Include country code, no + or spaces. Example: 94771234567</p>
          </div>
          <button
            onClick={savePhone}
            className="btn-primary px-4 whitespace-nowrap"
          >
            Save
          </button>
        </div>
        {savedPhone && (
          <p className="text-xs text-green-700 mt-2 font-medium">✓ Saved: +{savedPhone}</p>
        )}
      </div>

      {/* Note about automation */}
      <div className="card bg-yellow-50 border-l-4 border-yellow-400 mb-6">
        <p className="text-sm text-yellow-800">
          <span className="font-bold">ℹ️ How it works:</span> Clicking "Send" opens WhatsApp with a pre-filled message. Full automation (auto-send every Sunday) requires a backend service.
        </p>
      </div>

      {/* Alert Cards */}
      <div className="space-y-4">
        {alerts.map(alert => {
          const colors = colorClasses[alert.color]
          return (
            <div key={alert.id} className={`card border-l-4 ${colors.card}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-[var(--text)]">
                    {alert.icon} {alert.title}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{alert.desc}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  alert.available ? colors.badge : 'bg-[var(--surface-2)] text-[var(--text-dim)]'
                }`}>
                  {alert.available ? 'Ready' : 'N/A'}
                </span>
              </div>

              {alert.available && alert.message && (
                <>
                  <div className="bg-[var(--surface)] rounded p-2 text-xs text-[var(--text)] font-mono mb-3 border border-[var(--border)] whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {alert.message}
                  </div>
                  <button
                    onClick={() => sendWhatsApp(alert.message)}
                    disabled={!savedPhone && !phoneNumber}
                    className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                      savedPhone || phoneNumber
                        ? colors.btn
                        : 'bg-gray-200 text-[var(--text-dim)] cursor-not-allowed'
                    }`}
                  >
                    💬 Send via WhatsApp
                  </button>
                  {!savedPhone && !phoneNumber && (
                    <p className="text-xs text-red-500 mt-1 text-center">Enter your phone number above first</p>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
