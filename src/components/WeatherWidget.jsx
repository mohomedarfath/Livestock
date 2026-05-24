import { useState, useEffect } from 'react'

const WMO = {
  0:  { label: 'Clear Sky',         icon: '☀️' },
  1:  { label: 'Mostly Clear',      icon: '🌤️' },
  2:  { label: 'Partly Cloudy',     icon: '⛅' },
  3:  { label: 'Overcast',          icon: '☁️' },
  45: { label: 'Foggy',             icon: '🌫️' },
  48: { label: 'Icy Fog',           icon: '🌫️' },
  51: { label: 'Light Drizzle',     icon: '🌦️' },
  53: { label: 'Drizzle',           icon: '🌦️' },
  55: { label: 'Heavy Drizzle',     icon: '🌧️' },
  61: { label: 'Light Rain',        icon: '🌧️' },
  63: { label: 'Rain',              icon: '🌧️' },
  65: { label: 'Heavy Rain',        icon: '🌧️' },
  71: { label: 'Light Snow',        icon: '🌨️' },
  73: { label: 'Snow',              icon: '❄️' },
  75: { label: 'Heavy Snow',        icon: '❄️' },
  80: { label: 'Rain Showers',      icon: '🌦️' },
  81: { label: 'Rain Showers',      icon: '🌧️' },
  82: { label: 'Violent Showers',   icon: '⛈️' },
  95: { label: 'Thunderstorm',      icon: '⛈️' },
  96: { label: 'Thunderstorm + Hail', icon: '⛈️' },
  99: { label: 'Thunderstorm + Hail', icon: '⛈️' },
}

function getWeatherInfo(code) {
  return WMO[code] || WMO[Math.floor(code / 10) * 10] || { label: 'Unknown', icon: '🌡️' }
}

function getFarmAdvice(code, tempC) {
  if (code >= 95) return '⚠️ Thunderstorm — keep birds indoors, check coops are secure.'
  if (code >= 80) return '🌧️ Rain showers expected — ensure drainage is clear and coops stay dry.'
  if (code >= 61) return '🌧️ Rainy day — check for leaks in coops and watch for wet litter.'
  if (code >= 51) return '🌦️ Drizzly — keep feed dry and monitor for damp bedding.'
  if (code >= 45) return '🌫️ Foggy morning — check ventilation to reduce moisture in coops.'
  if (tempC >= 35) return '🔥 Very hot — ensure plenty of cool, fresh water. Heat stress is a risk.'
  if (tempC >= 28) return '☀️ Hot day — add extra drinkers, provide shade, and check birds frequently.'
  if (tempC <= 5)  return '🥶 Cold — check heating, seal drafts, and give extra energy-rich feed.'
  if (code <= 1)   return '☀️ Great weather — ideal day for flock inspections and outdoor tasks.'
  return '👍 Good conditions — a normal day on the farm.'
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [status, setStatus]   = useState('loading') // loading | ok | denied | offline

  useEffect(() => {
    if (!navigator.geolocation) { setStatus('denied'); return }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude.toFixed(2)}&longitude=${coords.longitude.toFixed(2)}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&wind_speed_unit=kmh&timezone=auto`
          const res  = await fetch(url)
          const data = await res.json()
          const c    = data.current
          setWeather({
            temp:     Math.round(c.temperature_2m),
            code:     c.weather_code,
            humidity: c.relative_humidity_2m,
            wind:     Math.round(c.wind_speed_10m),
          })
          setStatus('ok')
        } catch {
          setStatus('offline')
        }
      },
      () => setStatus('denied'),
      { timeout: 8000 }
    )
  }, [])

  if (status === 'denied' || status === 'offline') return null

  if (status === 'loading') {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
        <span style={{ fontSize: '22px', opacity: .4 }}>🌤️</span>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>Fetching local weather…</p>
      </div>
    )
  }

  const { icon, label } = getWeatherInfo(weather.code)
  const advice = getFarmAdvice(weather.code, weather.temp)

  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.04em', opacity: .7, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🌤️</span> Local Weather
        </h2>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Live · Your Location</span>
      </div>

      {/* Main weather row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '14px', flexShrink: 0,
          background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px',
        }}>
          {icon}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
            {weather.temp}°C
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</p>
        </div>

        {/* Humidity + wind */}
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>💧 {weather.humidity}% humidity</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>💨 {weather.wind} km/h wind</span>
        </div>
      </div>

      {/* Farm advice */}
      <div style={{
        padding: '10px 12px', borderRadius: '8px',
        background: 'var(--surface-2)', border: '1px solid var(--border)',
      }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{advice}</p>
      </div>
    </div>
  )
}
