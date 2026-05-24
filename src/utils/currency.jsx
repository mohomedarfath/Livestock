import { createContext, useContext, useState } from 'react'

export const CURRENCIES = {
  LKR: { code: 'LKR', symbol: 'Rs',   name: 'Sri Lankan Rupee',  flag: '🇱🇰' },
  INR: { code: 'INR', symbol: '₹',    name: 'Indian Rupee',      flag: '🇮🇳' },
  USD: { code: 'USD', symbol: '$',    name: 'US Dollar',         flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€',    name: 'Euro',              flag: '🇪🇺' },
  NGN: { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira',    flag: '🇳🇬' },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling',   flag: '🇰🇪' },
  GHS: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi',    flag: '🇬🇭' },
  PHP: { code: 'PHP', symbol: '₱',   name: 'Philippine Peso',   flag: '🇵🇭' },
  BDT: { code: 'BDT', symbol: '৳',   name: 'Bangladeshi Taka',  flag: '🇧🇩' },
  PKR: { code: 'PKR', symbol: 'Rs',  name: 'Pakistani Rupee',   flag: '🇵🇰' },
  IDR: { code: 'IDR', symbol: 'Rp',  name: 'Indonesian Rupiah', flag: '🇮🇩' },
  BRL: { code: 'BRL', symbol: 'R$',  name: 'Brazilian Real',    flag: '🇧🇷' },
  ZAR: { code: 'ZAR', symbol: 'R',   name: 'South African Rand',flag: '🇿🇦' },
  GBP: { code: 'GBP', symbol: '£',   name: 'British Pound',     flag: '🇬🇧' },
  MYR: { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit', flag: '🇲🇾' },
  VND: { code: 'VND', symbol: '₫',   name: 'Vietnamese Dong',   flag: '🇻🇳' },
}

const CurrencyContext = createContext(null)

export function CurrencyProvider({ children }) {
  const [code, setCode] = useState(
    () => localStorage.getItem('clucktrack_currency') || 'LKR'
  )

  const changeCurrency = (newCode) => {
    if (CURRENCIES[newCode]) {
      setCode(newCode)
      localStorage.setItem('clucktrack_currency', newCode)
    }
  }

  const currency = CURRENCIES[code]

  // Format a number with the currency symbol, e.g. "Rs 1,200"
  const fmt = (amount) =>
    `${currency.symbol} ${Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`

  return (
    <CurrencyContext.Provider value={{ currency, CURRENCIES, changeCurrency, fmt }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
