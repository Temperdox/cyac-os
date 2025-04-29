import React, { useState, useEffect } from 'react';
import styles from './PowerButton.module.css';
import { AudioManager } from '../../services/AudioManager';

interface PowerButtonProps {
    onPowerOn: () => void;
}

const PowerButton: React.FC<PowerButtonProps> = ({ onPowerOn }) => {
    const [glowing, setGlowing] = useState(false);
    const [hovering, setHovering] = useState(false);

    // Create a pulsing effect
    useEffect(() => {
        const interval = setInterval(() => {
            setGlowing(prev => !prev);
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    const handlePowerOn = () => {
        // Enable sound effects as user interaction has occurred
        AudioManager.initialize();

        // Play power button click sound
        try {
            AudioManager.playSound('powerButton', '/sounds/power-on.mp3', { volume: 0.5 });
        } catch (error) {
            console.warn('Failed to play power button sound:', error);
        }

        // Add pressed effect before calling callback
        document.querySelector(`.${styles.powerButton}`)?.classList.add(styles.pressed);

        // Call the onPowerOn callback after a delay to show the effect
        setTimeout(() => {
            onPowerOn();
        }, 300);
    };

    return (
        <div className={styles.powerButtonContainer}>
            <div className={styles.instructions}>
                <div className={styles.instructionText}>CLICK TO POWER ON</div>
            </div>

            <button
                className={`${styles.powerButton} ${glowing ? styles.glowing : ''} ${hovering ? styles.hover : ''}`}
                onClick={handlePowerOn}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
                aria-label="Power On"
            >
                <div className={styles.powerSymbol}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 3V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M7 6.5C5.5 8 4.5 10 4.5 12.25C4.5 16.5 8 20 12.25 20C16.5 20 20 16.5 20 12.25C20 10 19 8 17.5 6.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"/>
                    </svg>
                </div>
            </button>

            <div className={styles.statusMessage}>
                <span className={`${styles.indicator} ${glowing ? styles.blinking : ''}`}></span>
                SYSTEM STANDBY
            </div>
        </div>
    );
};

export default PowerButton;