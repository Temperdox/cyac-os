import React, { useEffect, useState } from 'react';
import styles from './UserBanner.module.css';
import { DiscordAuthService } from '../../services/DiscordAuthService';

interface UserBannerProps {
    onLogout?: () => void;
    onMinimizeAll?: () => void;
    onCloseAll?: () => void;
}

const UserBanner: React.FC<UserBannerProps> = ({
                                                   onLogout,
                                                   onMinimizeAll,
                                                   onCloseAll
                                               }) => {
    const [user, setUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasSudo, setHasSudo] = useState(false);

    // Check authentication status and get user data
    useEffect(() => {
        const checkAuth = async () => {
            const authenticated = await DiscordAuthService.isAuthenticated();
            setIsAuthenticated(authenticated);

            if (authenticated) {
                const userData = DiscordAuthService.getCurrentUser();
                setUser(userData);
                // Check if the user has sudo privileges
                setHasSudo(!!(userData?.isPrivileged || userData?.isDev));
            }
        };

        checkAuth().then(r => console.log(r));
        // Set interval to periodically check authentication status
        const interval = setInterval(checkAuth, 60000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    // Handle logout
    const handleLogout = () => {
        DiscordAuthService.logout();
        setIsAuthenticated(false);
        setUser(null);
        if (onLogout) onLogout();
    };

    // Generate avatar URL
    const getAvatarUrl = () => {
        if (!user || !user.avatar) {
            return 'https://cdn.discordapp.com/embed/avatars/0.png'; // Default Discord avatar
        }

        return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
    };

    // Get banner URL if available
    const getBannerUrl = () => {
        if (!user || !user.banner) {
            return null;
        }
        return `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png?size=480`;
    };

    return (
        <div className={styles.userAuthBanner}>
            {/* Banner background with gradient overlay - shown only when logged in */}
            {isAuthenticated && (
                <div
                    className={styles.bannerBackground}
                    style={{
                        backgroundImage: getBannerUrl() ? `url(${getBannerUrl()})` : 'linear-gradient(45deg, #1a1a1a, #2a2a2a)'
                    }}
                >
                    <div className={styles.bannerGradientOverlay}></div>
                    <div className={styles.scanlines}></div>
                </div>
            )}

            <div className={styles.userAuthContent}>
                {isAuthenticated ? (
                    // Logged in view
                    <>
                        <img
                            src={getAvatarUrl()}
                            alt={user?.username || 'User Avatar'}
                            className={styles.userAvatar}
                        />
                        <div className={styles.userInfo}>
                            <div className={styles.username}>{user?.username?.toUpperCase() || 'USER'}</div>
                            <div className={styles.accessLevel}>
                                <span className={styles.levelIndicator}></span>
                                LEVEL {user?.accessLevel || '1'}
                            </div>
                        </div>

                        {/* Styled logout button */}
                        <button className={styles.authBtn} onClick={handleLogout}>
                            LOGOUT
                        </button>

                        {hasSudo && <div className={styles.sudoBadge}>SUDO</div>}
                    </>
                ) : (
                    // Logged out view - Guest user
                    <>
                        <div className={styles.notAuthenticatedMessage}>
                            SYSTEM NOT AUTHENTICATED
                        </div>

                        {/* Styled login button */}
                        <button
                            className={styles.authBtn}
                            onClick={() => DiscordAuthService.login()}
                        >
                            LOGIN
                        </button>
                    </>
                )}
            </div>

            <div className={styles.menuControls}>
                <div className={styles.menuColumn}>
                    <div className={styles.sectionHeader}>DIRECTORIES</div>
                    <ul className={styles.menuList}>
                        <li className={styles.menuItem}>HOME</li>
                        <li className={styles.menuItem}>SYS</li>
                        <li className={styles.menuItem}>RESTRICTED</li>
                    </ul>
                </div>
                <div className={styles.menuColumn}>
                    <div className={styles.sectionHeader}>WINDOWS</div>
                    <ul className={styles.menuList}>
                        <li
                            className={styles.menuItem}
                            onClick={onMinimizeAll}
                        >
                            MINIMIZE ALL
                        </li>
                        <li
                            className={styles.menuItem}
                            onClick={onCloseAll}
                        >
                            CLOSE ALL
                        </li>
                    </ul>
                </div>
            </div>

            <div className={styles.searchBar}>
                <input
                    type="text"
                    placeholder="SEARCH..."
                    className={styles.searchInput}
                />
            </div>
        </div>
    );
};

export default UserBanner;