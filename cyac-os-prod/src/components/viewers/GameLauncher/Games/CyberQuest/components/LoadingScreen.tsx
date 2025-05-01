import React, { useState, useEffect } from 'react';
import styles from './LoadingScreen.module.css';

const LoadingScreen: React.FC = () => {
    const [loadingText, setLoadingText] = useState<string>('Initializing system...');
    const [progress, setProgress] = useState<number>(0);

    const loadingMessages = [
        'Initializing system...',
        'Establishing secure connection...',
        'Loading mission data...',
        'Calibrating neural interface...',
        'Synchronizing databases...',
        'Verifying user credentials...',
        'Loading cyberspace environment...',
        'Establishing quantum encryption...',
        'Compiling mission assets...',
        'System ready. Entering CyberQuest...'
    ];

    useEffect(() => {
        let currentIndex = 0;

        // Update loading message and progress at intervals
        const interval = setInterval(() => {
            if (currentIndex < loadingMessages.length - 1) {
                currentIndex++;
                setLoadingText(loadingMessages[currentIndex]);
                setProgress((currentIndex / (loadingMessages.length - 1)) * 100);
            } else {
                clearInterval(interval);
            }
        }, 800);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.loadingScreen}>
            <div className={styles.loadingContent}>
                <div className={styles.loadingHeader}>
                    <h1 className={styles.loadingTitle}>CyberQuest</h1>
                    <div className={styles.loadingSubtitle}>System Initialization</div>
                </div>

                <div className={styles.spinner}>
                    <div className={styles.spinnerInner}></div>
                </div>

                <div className={styles.loadingInfo}>
                    <div className={styles.loadingStatus}>
                        {loadingText}
                    </div>

                    <div className={styles.loadingBarContainer}>
                        <div
                            className={styles.loadingBar}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <div className={styles.loadingPercentage}>
                        {Math.floor(progress)}%
                    </div>
                </div>

                <div className={styles.loadingFooter}>
                    <div className={styles.copyright}>
                        CyberAcme Corporation © 2025
                    </div>
                    <div className={styles.securityLevel}>
                        Security Level: ALPHA
                    </div>
                </div>
            </div>

            <div className={styles.backgroundEffects}>
                <div className={styles.gridLines}></div>
                <div className={styles.scanlines}></div>
            </div>
        </div>
    );
};

export default LoadingScreen;