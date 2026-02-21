/* ============================================================
   Greeting.js — Time-based Greeting Component
   ============================================================
   Displays a personalized greeting based on the current time
   of day (Morning, Afternoon, Evening) along with the user's
   name.
   
   Props:
     - userName: The logged-in user's name to display in greeting
   ============================================================ */

import { FiSun, FiMoon, FiSunrise } from 'react-icons/fi';

function Greeting({ userName }) {
    /* Determine the current hour to choose the right greeting */
    const hour = new Date().getHours();
    let message, Icon;

    /* Set greeting message and icon based on time of day */
    if (hour < 12) {
        message = 'Good Morning';      // 12 AM - 11:59 AM
        Icon = FiSunrise;               // Sunrise icon for morning
    } else if (hour < 18) {
        message = 'Good Afternoon';     // 12 PM - 5:59 PM
        Icon = FiSun;                   // Sun icon for afternoon
    } else {
        message = 'Good Evening';       // 6 PM - 11:59 PM
        Icon = FiMoon;                  // Moon icon for evening
    }

    return (
        <div style={styles.container}>
            {/* Time-of-day icon */}
            <Icon style={styles.icon} />
            <div>
                {/* Personalized greeting with user's name */}
                <h2 style={styles.message}>
                    {message}, {userName || 'User'}!
                </h2>
                {/* Motivational subtitle */}
                <p style={styles.subtitle}>What do you want to get done today?</p>
            </div>
        </div>
    );
}

/* ============================================================
   Inline Styles for Greeting Component
   ============================================================ */
const styles = {
    /* Container with light blue background */
    container: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '16px 20px',
        background: '#f0f4ff',
        borderRadius: '12px',
        marginBottom: '24px',
    },
    /* Icon styling — amber/yellow color */
    icon: {
        fontSize: '1.8rem',
        color: '#f59e0b',
    },
    /* Greeting message text */
    message: {
        fontSize: '1.1rem',
        fontWeight: 600,
        color: '#1e293b',
        margin: 0,
    },
    /* Subtitle text below greeting */
    subtitle: {
        fontSize: '0.85rem',
        color: '#64748b',
        margin: '2px 0 0',
    },
};

export default Greeting;
