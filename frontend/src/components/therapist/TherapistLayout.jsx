import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import {
    LogOut, LayoutDashboard, Calendar, ClipboardList, FileText,
    Archive, Users, Briefcase, UserCog, Menu, X
} from 'lucide-react';
import './TherapistDashboard.css';
import NotificationBell from '../shared/NotificationBell';

// Single source of truth for the sidebar — every therapist page (including
// this one's own child route) renders inside this shell, so the nav never
// disappears when you click between sections.
const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/therapist-dashboard' },
    { label: 'My Schedule', icon: Calendar, path: '/therapist-dashboard/schedule' },
    { label: 'My Patients', icon: ClipboardList, path: '/therapist-dashboard/caseload' },
    { label: 'Session Notes', icon: FileText, path: '/therapist-dashboard/prescriptions' },
    { label: 'Patient History', icon: Archive, path: '/therapist-dashboard/archive' },
    { label: 'Group Sessions', icon: Users, path: '/therapist-dashboard/group-proposals' },
    { label: 'Earnings', icon: Briefcase, path: '/therapist-dashboard/earnings' },
    { label: 'My Profile', icon: UserCog, path: '/therapist-dashboard/profile' },
];

const getInitials = (fullName = '') => {
    return fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

const TherapistLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const sidebarRef = useRef(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || storedUser.role !== 'therapist') {
            navigate('/login');
            return;
        }
        setUser(storedUser);
    }, [navigate]);

    // Close sidebar when navigating to a new route
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    // Close sidebar when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setSidebarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarOpen]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) {
        return null;
    }

    return (
        <div className="dashboard-shell">
            {/* Top Navbar — persistent across every page */}
            <header className="navbar">
                <div className="navbar-left">
                    {/* Hamburger — only visible on small screens */}
                    <button
                        className="hamburger-btn"
                        onClick={() => setSidebarOpen((prev) => !prev)}
                        aria-label="Toggle navigation"
                    >
                        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <div className="brand-logo">S</div>
                    <span className="brand-name">Smart Recovery Portal</span>
                    <span className="badge-role">Therapist</span>
                </div>
                <div className="navbar-right">
                    <NotificationBell />
                    <div className="user-chip">
                        <div className="avatar">{getInitials(user.name)}</div>
                        <span className="user-name">{user.name}</span>
                    </div>
                </div>
            </header>

            {/* Overlay — dims the page behind the open sidebar on mobile */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Left Sidebar — persistent across every page, highlights the current route */}
            <aside ref={sidebarRef} className={`sidebar${sidebarOpen ? ' open' : ''}`}>
                <nav className="nav-list">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </aside>

            {/* Whichever nav item is active renders here */}
            <main className="main-content">
                <Outlet context={{ user }} />
            </main>
        </div>
    );
};

export default TherapistLayout;
