import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Storage } from '../../utils/storage';
import { ALL_NAV } from '../../utils/navigation';

const roleBadgeStyle = {
    admin: { background: '#fee2e2', color: '#dc2626' },
    manager: { background: '#dbeafe', color: '#1d4ed8' },
    employee: { background: '#d1fae5', color: '#047857' },
    accountant: { background: '#f3e8ff', color: '#7e22ce' },
};

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
    const { user, logout } = useAuth();
    const settings = Storage.getSettings();
    const navItems = ALL_NAV.filter((n) => n.roles.includes(user.role));

    return (
        <>
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 md:hidden"
                    style={{ background: 'var(--overlay)' }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div
                className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 w-64 md:w-60 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
                style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div
                        className="h-14 flex items-center justify-center md:justify-start px-0 md:px-4 shrink-0 gap-3"
                        style={{ borderBottom: '1px solid var(--border)' }}
                    >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-farm-orange to-farm-orange-dark flex items-center justify-center shrink-0">
                            {settings.logo ? (
                                <img src={settings.logo} alt="logo" className="w-7 h-7 rounded-lg object-cover" />
                            ) : (
                                <span className="text-sm">🐓</span>
                            )}
                        </div>
                        <div className={`min-w-0 ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
                            <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px', lineHeight: '1.2', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {settings.farmName || 'CluckTrack Pro'}
                            </p>
                            <p style={{ fontSize: '10px', color: 'var(--text-dim)', margin: 0 }}>Farm Management</p>
                        </div>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `w-full flex items-center gap-3 px-2.5 py-3 rounded-lg text-sm transition-all duration-150 ${isActive ? 'font-semibold' : 'font-normal'
                                    }`
                                }
                                style={({ isActive }) => ({
                                    background: isActive ? 'var(--accent-bg)' : 'transparent',
                                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                                })}
                            >
                                <span className="text-base shrink-0 w-5 text-center">{item.icon}</span>
                                <span className={`truncate ${sidebarOpen ? 'block' : 'hidden md:block'}`}>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* User + Logout */}
                    <div className="shrink-0 p-2 space-y-0.5" style={{ borderTop: '1px solid var(--border)' }}>
                        <div className={`px-2.5 py-2 rounded-lg ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-farm-orange to-farm-orange-dark flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                                    <span
                                        style={{
                                            fontSize: '10px', padding: '1px 6px', borderRadius: '99px', fontWeight: 500,
                                            ...(roleBadgeStyle[user.role] || { background: 'var(--surface-2)', color: 'var(--text-muted)' }),
                                        }}
                                    >
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-2.5 py-3 rounded-lg text-sm transition-all duration-150"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <span className="text-base shrink-0 w-5 text-center">🚪</span>
                            <span className={`${sidebarOpen ? 'block' : 'hidden md:block'}`}>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
