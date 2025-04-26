// src/components/auth/DiscordCallback.tsx
import React, { useEffect, useState } from 'react';
import styles from './DiscordCallback.module.css';
import { DiscordAuthService } from '../../../services/DiscordAuthService';

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

            // Extract the code from URL
            const url = new URL(window.location.href);
            const code = url.searchParams.get('code');

            console.log("DiscordCallback: URL path", url.pathname);
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

                // Success
                const user = DiscordAuthService.getCurrentUser();

                setStatus('success');
                setMessage('Login successful! Redirecting...');

                setTimeout(() => {
                    // Clear the code from the URL
                    window.history.replaceState({}, document.title, '/');

                    onComplete({
                        success: true,
                        username: user?.username
                    });
                }, 1500);

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