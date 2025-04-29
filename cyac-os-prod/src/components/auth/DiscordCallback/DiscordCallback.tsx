import React, { useEffect, useState } from 'react';
import styles from './DiscordCallback.module.css';
import { DiscordAuthService } from '../../../services/DiscordAuthService';
import { AuthService } from '../../../services/AuthService';

interface DiscordCallbackProps {
    onComplete: (result: { success: boolean; username?: string }) => void;
}

const DiscordCallback: React.FC<DiscordCallbackProps> = ({ onComplete }) => {
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('Processing your Discord login...');
    const [details, setDetails] = useState('');

    useEffect(() => {
        const processCallback = async () => {
            console.log("DiscordCallback: Component mounted");
            console.log("URL:", window.location.href);
            console.log("Path:", window.location.pathname);

            // Extract the code from URL
            const url = new URL(window.location.href);
            const code = url.searchParams.get('code');

            console.log("DiscordCallback: Code present:", !!code);

            if (!code) {
                console.error("DiscordCallback: No code provided in URL");
                setStatus('error');
                setMessage('No authentication code provided.');
                setDetails('The URL does not contain a valid Discord authorization code.');
                onComplete({ success: false });
                return;
            }

            try {
                setStatus('processing');
                setMessage('Exchanging code for token...');

                // Exchange code for token
                const success = await DiscordAuthService.handleCallback(code);

                if (!success) {
                    console.error("DiscordCallback: Token exchange failed");
                    setStatus('error');
                    setMessage('Authentication failed');
                    setDetails('Unable to complete authentication with Discord.');
                    onComplete({ success: false });
                    return;
                }

                // Get the Discord user
                const discordUser = DiscordAuthService.getCurrentUser();

                if (!discordUser) {
                    console.error("DiscordCallback: Got success but no user data");
                    setStatus('error');
                    setMessage('Authentication failed');
                    setDetails('Unable to retrieve user information from Discord.');
                    onComplete({ success: false });
                    return;
                }

                // Sync with main AuthService
                const authResult = AuthService.loginWithDiscord(discordUser);

                if (!authResult.success) {
                    console.error("DiscordCallback: Failed to sync with AuthService");
                    setStatus('error');
                    setMessage('Authentication failed');
                    setDetails('Unable to complete local authentication.');
                    onComplete({ success: false });
                    return;
                }

                // Success
                setStatus('success');
                setMessage(`Login successful as ${discordUser.username}! Redirecting...`);

                // Add a delay to show the success message before redirecting
                setTimeout(() => {
                    // Clear the code from the URL
                    window.history.replaceState({}, document.title, '/');

                    onComplete({
                        success: true,
                        username: discordUser.username
                    });
                }, 2000);

            } catch (err) {
                console.error("Discord login callback error:", err);
                setStatus('error');
                setMessage('Authentication failed');
                setDetails(err instanceof Error ? err.message : 'Unknown error');
                onComplete({ success: false });
            }
        };

        processCallback();
    }, [onComplete]);

    return (
        <div className={styles.discordCallback}>
            <div className={`${styles.callbackMessage} ${styles[status]}`}>
                <div className={styles.callbackIcon}>
                    {status === 'processing' && <div className={styles.loadingSpinner}></div>}
                    {status === 'success'    && <div className={styles.successCheck}>✓</div>}
                    {status === 'error'      && <div className={styles.errorX}>✕</div>}
                </div>
                <h2 className={status === 'error' ? styles.errorText : ''}>{message}</h2>
                {details && <p className={styles.detailsText}>{details}</p>}
                {status === 'error' && (
                    <button onClick={() => window.location.href = '/'} className={styles.returnButton}>
                        RETURN TO TERMINAL
                    </button>
                )}
            </div>
        </div>
    );
};

export default DiscordCallback;