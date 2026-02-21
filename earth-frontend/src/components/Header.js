/* ============================================================
   Header.js — App Header with Logout Button
   ============================================================
   Displays the app title with a clipboard icon and a logout
   button. When the user clicks logout, it clears their session
   and redirects to the login page.
   
   Props:
     - onLogout: Callback function to clear user state and navigate
   ============================================================ */

import { FaClipboardList } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';

function Header({ onLogout }) {
    return (
        <header style={styles.header}>
            {/* App icon and title */}
            <div style={styles.titleSection}>
                <FaClipboardList style={styles.icon} />
                <h1 style={styles.title}>Task Manager</h1>
            </div>

            {/* Logout button — calls onLogout prop when clicked */}
            <button style={styles.logoutBtn} onClick={onLogout}>
                <FiLogOut style={{ marginRight: '6px' }} />
                Logout
            </button>
        </header>
    );
}

/* ============================================================
   Inline Styles for Header Component
   ============================================================ */
const styles = {
    /* Header bar — flex layout with space between title and logout */
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 0',
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '20px',
    },
    /* Title section: icon + text grouped together */
    titleSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    /* Clipboard icon styling */
    icon: {
        fontSize: '1.8rem',
        color: '#667eea',
    },
    /* App title text */
    title: {
        fontSize: '1.6rem',
        fontWeight: 700,
        color: '#1e293b',
        margin: 0,
    },
    /* Logout button styling */
    logoutBtn: {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        background: '#fee2e2',
        color: '#ef4444',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.85rem',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background 0.2s',
    },
};

export default Header;
