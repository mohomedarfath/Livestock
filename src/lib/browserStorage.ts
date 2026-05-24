export function getStoredValue(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ?? fallback
  } catch {
    return fallback
  }
}

export function setStoredValue(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore quota and private-mode failures for resilient UX.
  }
}
