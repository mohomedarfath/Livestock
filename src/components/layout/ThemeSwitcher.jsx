import { useState } from 'react';
import { useTheme, THEMES } from '../../context/ThemeContext';

export default function ThemeSwitcher() {
    const { themeId, setThemeId } = useTheme();
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                title="Change theme"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'rgba(0,0,0,.06)', color: 'var(--text)' }}
            >
                <span style={{ fontSize: '15px' }}>🎨</span>
                <span style={{ fontSize: '10px', opacity: 0.5 }}>▾</span>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div
                        className="absolute right-0 top-10 z-50 rounded-xl overflow-hidden p-2"
                        style={{
                            background: 'var(--surface)',
                            boxShadow: '0 4px 24px var(--shadow-md), 0 1px 4px var(--shadow-color)',
                            border: '1px solid var(--border)',
                            minWidth: '200px',
                        }}
                    >
                        <p className="text-[10px] font-semibold text-[color:var(--text-dim)] uppercase tracking-wide px-2 pb-2">
                            Choose Theme
                        </p>
                        {Object.values(THEMES).map((t) => {
                            const isActive = t.id === themeId;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => { setThemeId(t.id); setOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                                    style={{
                                        background: isActive ? 'var(--accent-bg)' : 'transparent',
                                        color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                                        fontWeight: isActive ? 600 : 400,
                                    }}
                                >
                                    <div className="flex gap-1 shrink-0">
                                        {t.preview.map((c, i) => (
                                            <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,.12)' }} />
                                        ))}
                                    </div>
                                    <span className="text-[13px]">{t.icon} {t.name}</span>
                                    {isActive && <span className="ml-auto text-[12px]">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
