import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import {
    LogOut, LayoutDashboard, Calendar, ClipboardList, FileText,
    Archive, Users, Briefcase, UserCog
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

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || storedUser.role !== 'therapist') {
            navigate('/login');
            return;
        }
        setUser(storedUser);
    }, [navigate]);

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

            {/* Left Sidebar — persistent across every page, highlights the current route */}
            <aside className="sidebar">
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
