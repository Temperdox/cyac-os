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
                        <path d="M12 2C12.5523 2 13 2.44772 13 3V12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12V3C11 2.44772 11.4477 2 12 2Z" fill="currentColor"/>
                        <path d="M8.10657 5.0636C8.36534 4.6088 8.19239 4.03614 7.73755 3.77736C7.28272 3.51858 6.71006 3.69153 6.45128 4.14637C5.17332 6.45034 5.07498 9.23639 6.18865 11.6175C7.30231 13.9985 9.51896 15.636 12.0006 15.9952C14.4823 16.3544 16.9608 15.3847 18.522 13.4043C20.0832 11.4239 20.5039 8.74497 19.6247 6.35492C19.3903 5.88843 18.8256 5.68923 18.3591 5.92358C17.8926 6.15793 17.6934 6.72265 17.9278 7.18914C18.5792 8.91336 18.2652 10.877 17.1209 12.3668C15.9767 13.8566 14.1429 14.5878 12.3199 14.3181C10.4968 14.0485 8.89148 12.8192 8.06404 11.0307C7.2366 9.24221 7.31016 7.1629 8.25378 5.44254C8.51255 4.9877 8.33961 4.41504 7.88477 4.15627C7.42994 3.89749 6.85728 4.07043 6.5985 4.52527C5.39489 6.68749 5.30197 9.33108 6.35994 11.574C7.41791 13.8168 9.52035 15.3919 12.0015 15.8301C14.4827 16.2683 17.0157 15.2094 18.6754 13.1269C20.335 11.0444 20.7968 8.15168 19.8425 5.53632C19.6081 5.06983 19.0434 4.87062 18.5769 5.10497C18.1104 5.33933 17.9112 5.90405 18.1456 6.37054C18.8825 8.3776 18.5345 10.6318 17.2402 12.316C15.9458 14.0002 13.8511 14.8461 11.6994 14.5611C9.5476 14.276 7.69016 12.94 6.71947 11.0114C5.74877 9.08287 5.82567 6.76969 6.91987 4.91892C7.17865 4.46408 7.0057 3.89142 6.55087 3.63265C6.09603 3.37387 5.52337 3.54681 5.26459 4.00165C3.89182 6.32025 3.79945 9.1606 4.96244 11.5922C6.12544 14.0239 8.40739 15.6784 11 16.0137V16C11 15.4477 11.4477 15 12 15C12.5523 15 13 15.4477 13 16C13 16.5523 12.5523 17 12 17C8.73644 17 5.72854 15.0135 4.20608 12.0004C2.68361 8.98732 2.8488 5.29711 4.60702 2.43968C4.86579 1.98485 4.69285 1.41219 4.23801 1.15341C3.78317 0.894629 3.21051 1.06757 2.95174 1.52241C0.831406 4.92487 0.631613 9.30689 2.47792 12.9326C4.32422 16.5583 8.0085 18.9286 12 19V19C12.5523 19 13 19.4477 13 20C13 20.5523 12.5523 21 12 21C12.5523 21 13 21.4477 13 22C13 22.5523 12.5523 23 12 23C11.4477 23 11 22.5523 11 22C11 21.4477 11.4477 21 12 21C7.35997 21 3.13495 18.2549 1.02128 14.0004C-1.09239 9.74597 -0.0625969 4.69822 3.21291 1.53024C3.47168 1.07541 3.29874 0.502748 2.8439 0.243969C2.38907 -0.0148106 1.81641 0.15813 1.55763 0.612966C-2.11248 4.20554 -3.27072 9.85832 -0.896234 14.7322C1.47825 19.6061 6.39352 22.8287 12 22.9863V23C12.5523 23 13 23.4477 13 24C13 24.5523 12.5523 25 12 25C11.4477 25 11 24.5523 11 24C11 23.4477 11.4477 23 12 23" fill="currentColor"/>
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