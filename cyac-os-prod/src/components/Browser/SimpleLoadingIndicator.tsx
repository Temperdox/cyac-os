import React, { useEffect } from 'react';
import styles from './ConnectionAnimation.module.css';

interface SimpleLoadingIndicatorProps {
    url: string;
    onComplete?: () => void; // Optional callback for completion
}

const SimpleLoadingIndicator: React.FC<SimpleLoadingIndicatorProps> = ({ url, onComplete }) => {
    // Log component mounting
    useEffect(() => {
        console.log('SimpleLoadingIndicator mounted for URL:', url);

        // Auto-complete after a delay if onComplete is provided
        if (onComplete) {
            const timer = setTimeout(() => {
                console.log('SimpleLoadingIndicator auto-completing');
                onComplete();
            }, 2000);

            return () => {
                clearTimeout(timer);
                console.log('SimpleLoadingIndicator unmounted');
            };
        }

        return () => {
            console.log('SimpleLoadingIndicator unmounted');
        };
    }, [url, onComplete]);

    // Helper function to get a simplified URL for display
    const getDisplayUrl = (fullUrl: string): string => {
        // Extract domain or simplify for display
        try {
            // Handle potential URL parsing errors
            if (!fullUrl) return '';

            const urlObj = new URL(
                fullUrl.startsWith('http') ? fullUrl : `https://${fullUrl}`
            );
            return urlObj.hostname;
        } catch (e) {
            // If URL parsing fails, return the original string
            return fullUrl;
        }
    };

    // Format URL for display, truncating if too long
    const displayUrl = getDisplayUrl(url);
    const formattedUrl = displayUrl && displayUrl.length > 30 ?
        `${displayUrl.substring(0, 27)}...` :
        displayUrl;

    return (
        <div className={styles.simpleLoading}>
            <div className={styles.simpleLoadingText}>
                CONNECTING TO EXTERNAL NETWORK
            </div>

            <div className={styles.simpleProgressBar}>
                <div className={styles.simpleProgressFill}></div>
            </div>

            <div>
                {formattedUrl}
            </div>

            <div className={styles.securityStatus}>
                WARNING: EXTERNAL CONNECTION NOT SECURE
            </div>
        </div>
    );
};

export default SimpleLoadingIndicator;