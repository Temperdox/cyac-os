import React, { useEffect, useState } from 'react';
import styles from './UserBanner.module.css';
import { DiscordAuthService } from '../../services/DiscordAuthService';

interface UserBannerProps {
    onLogout?: () => void;
}

const UserBanner: React.FC<UserBannerProps> = ({
                                                   onLogout,
                                               }) => {
    const [user, setUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasSudo, setHasSudo] = useState(false);
    const [isDev, setIsDev] = useState(false);

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
                // Check if user is a developer
                setIsDev(!!userData?.isDev);
            } else {
                setUser(null);
                setHasSudo(false);
                setIsDev(false);
            }
        };

        checkAuth();
        // Set interval to periodically check authentication status
        const interval = setInterval(checkAuth, 60000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    // Handle login/logout
    const handleAuthAction = () => {
        if (isAuthenticated) {
            // Logout
            if (onLogout) onLogout();
        } else {
            // Direct login via Discord OAuth
            DiscordAuthService.login();
        }
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
                        <button className={styles.authBtn} onClick={handleAuthAction}>
                            LOGOUT
                        </button>

                        {/* Display SUDO badge if user has sudo privileges */}
                        {hasSudo && <div className={styles.sudoBadge}>SUDO</div>}

                        {/* Display DEV tag if user is a developer */}
                        {isDev && <div className={styles.devTag}>DEV</div>}
                    </>
                ) : (
                    // Logged out view - Guest user
                    <>
                        <div className={styles.guestAvatar}>
                            <span>G</span>
                        </div>
                        <div className={styles.userInfo}>
                            <div className={styles.username}>GUEST</div>
                            <div className={styles.accessLevel}>
                                <span className={styles.levelIndicator}></span>
                                LEVEL 0
                            </div>
                        </div>

                        {/* Styled login button */}
                        <button
                            className={styles.authBtn}
                            onClick={handleAuthAction}
                        >
                            LOGIN
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserBanner;