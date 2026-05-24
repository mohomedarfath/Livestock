import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import { ALL_NAV } from '../../utils/navigation';
import LoginPage from '../../pages/LoginPage';

export default function MainLayout() {
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
                <div className="text-center">
                    <div className="text-5xl mb-4 animate-bounce">🐓</div>
                    <p className="text-[color:var(--text-dim)] font-medium text-[13px]">Loading CluckTrack Pro...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    const navItems = ALL_NAV.filter((n) => n.roles.includes(user.role));

    return (
        <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="flex-1 min-h-screen flex flex-col">
                <div className="md:ml-60 flex-1 flex flex-col min-h-screen">
                    <Header />
                    <div className="flex-1 p-3 sm:p-5 md:pb-5" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
                        <Outlet />
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
                style={{
                    background: 'var(--surface)',
                    borderTop: '1px solid var(--border)',
                    boxShadow: '0 -2px 16px rgba(0,0,0,.08)',
                    minHeight: '60px',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                {navItems.slice(0, 4).map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="flex-1 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
                            style={{
                                background: 'none',
                                border: 'none',
                                borderTop: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                                color: isActive ? 'var(--accent)' : 'var(--text-dim)',
                                paddingTop: '2px',
                            }}
                        >
                            <span className="text-[20px] leading-none">{item.icon}</span>
                            <span className={`text-[9px] tracking-wide mt-[1px] ${isActive ? 'font-semibold' : 'font-normal'}`}>
                                {item.label.length > 8 ? item.label.slice(0, 8) + '…' : item.label}
                            </span>
                        </NavLink>
                    );
                })}
                {/* More Button */}
                <button
                    onClick={() => setSidebarOpen((v) => !v)}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
                    style={{
                        background: 'none',
                        border: 'none',
                        borderTop: sidebarOpen ? '2px solid var(--accent)' : '2px solid transparent',
                        color: sidebarOpen ? 'var(--accent)' : 'var(--text-dim)',
                        paddingTop: '2px',
                    }}
                >
                    <span className="text-[20px] leading-none">☰</span>
                    <span className={`text-[9px] tracking-wide mt-[1px] ${sidebarOpen ? 'font-semibold' : 'font-normal'}`}>
                        More
                    </span>
                </button>
            </nav>
        </div>
    );
}
