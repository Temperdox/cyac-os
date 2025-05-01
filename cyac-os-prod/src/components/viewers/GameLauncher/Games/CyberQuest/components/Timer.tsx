import React, { useEffect, useState } from 'react';
import styles from './Timer.module.css';

interface TimerProps {
    time: number;
    totalTime: number;
    isPaused: boolean;
}

const Timer: React.FC<TimerProps> = ({ time, totalTime, isPaused }) => {
    const [isWarning, setIsWarning] = useState(false);
    const [isCritical, setIsCritical] = useState(false);

    // Calculate percentage of time remaining
    const timePercent = (time / totalTime) * 100;

    // Update warning states based on time remaining
    useEffect(() => {
        setIsWarning(timePercent <= 30);
        setIsCritical(timePercent <= 10);
    }, [timePercent]);

    // Format time as mm:ss
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className={styles.timer}>
            <div
                className={`${styles.timeDisplay} ${isWarning ? styles.warning : ''} ${isCritical ? styles.critical : ''}`}
            >
                {isPaused ? 'PAUSED' : formatTime(time)}
            </div>
            <div className={styles.progressContainer}>
                <div
                    className={`${styles.progressBar} ${isWarning ? styles.warning : ''} ${isCritical ? styles.critical : ''}`}
                    style={{ width: `${timePercent}%` }}
                />
            </div>
        </div>
    );
};

export default Timer;