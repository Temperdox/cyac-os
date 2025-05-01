import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
    current: number;
    max: number;
    showLabel?: boolean;
    label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
                                                     current,
                                                     max,
                                                     showLabel = false,
                                                     label
                                                 }) => {
    // Calculate percentage (capped at 100%)
    const percentage = Math.min(100, Math.round((current / max) * 100));

    return (
        <div className={styles.progressBarWrapper}>
            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${percentage}%` }}
                ></div>

                {showLabel && (
                    <div className={styles.progressLabel}>
                        {label || `${percentage}%`}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressBar;