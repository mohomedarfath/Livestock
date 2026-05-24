import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrency } from '../../utils/currency.jsx';
import ThemeSwitcher from './ThemeSwitcher';
import { PAGE_TITLES } from '../../utils/navigation';

export default function Header() {
    const location = useLocation();
    const { currency, CURRENCIES, changeCurrency } = useCurrency();
    const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

    const currentTitle = PAGE_TITLES[location.pathname] || 'CluckTrack Pro';

    return (
        <div
            className="sticky top-0 z-40 h-14 flex items-center px-4 gap-3"
            style={{ background: 'var(--header-bg)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}
        >
            <h1 className="flex-1 font-semibold text-[color:var(--text)] text-[15px] m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {currentTitle}
            </h1>

            <ThemeSwitcher />

            <div className="relative">
                <button
                    onClick={() => setShowCurrencyMenu((prev) => !prev)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    style={{ background: 'rgba(0,0,0,.06)', color: 'var(--text)' }}
                >
                    <span>{currency.flag}</span>
                    <span>{currency.symbol}</span>
                    <span className="text-[10px] opacity-50">▾</span>
                </button>
                {showCurrencyMenu && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowCurrencyMenu(false)} />
                        <div
                            className="absolute right-0 top-10 rounded-lg overflow-hidden p-1 z-50 min-w-[160px]"
                            style={{
                                background: 'var(--surface)',
                                boxShadow: '0 2px 8px var(--shadow-md), 0 1px 2px var(--shadow-color)',
                                border: '1px solid var(--border)',
                            }}
                        >
                            {Object.values(CURRENCIES).map((c) => (
                                <button
                                    key={c.code}
                                    onClick={() => { changeCurrency(c.code); setShowCurrencyMenu(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors"
                                    style={{
                                        background: currency.code === c.code ? 'var(--accent)' : 'transparent',
                                        color: currency.code === c.code ? '#fff' : 'var(--text-muted)',
                                        fontWeight: currency.code === c.code ? 500 : 400,
                                    }}
                                >
                                    <span>{c.flag}</span>
                                    <span>{c.symbol}</span>
                                    <span className="text-[10px] opacity-50 ml-auto">{c.code}</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
