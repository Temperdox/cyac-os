import React, { useEffect, useState } from 'react';
import styles from './CrtEffects.module.css';

interface CrtEffectsProps {
    isHardwareAccelerated?: boolean;
}

export const CrtEffects: React.FC<CrtEffectsProps> = ({
                                                          isHardwareAccelerated = true
                                                      }) => {
    // Effects enabled states
    const [effects] = useState({
        scanlines: true,
        vignette: true,
        noise: true,
        flicker: true,
        glitch: isHardwareAccelerated, // Only enable glitch if hardware accelerated
        curvature: isHardwareAccelerated, // Only enable curvature if hardware accelerated
    });

    // Random glitch effect
    useEffect(() => {
        if (!effects.glitch) return;

        // Randomly trigger glitch effect
        const glitchInterval = setInterval(() => {
            if (Math.random() < 0.05) { // 5% chance every 3 seconds
                const glitchDuration = 50 + Math.random() * 150; // Random duration between 50-200ms

                const glitchElement = document.querySelector(`.${styles.glitchEffect}`);
                if (glitchElement) {
                    glitchElement.classList.add(styles.active);

                    setTimeout(() => {
                        glitchElement.classList.remove(styles.active);
                    }, glitchDuration);
                }
            }
        }, 3000);

        return () => clearInterval(glitchInterval);
    }, [effects.glitch]);

    // Screen flicker effect
    useEffect(() => {
        if (!effects.flicker) return;

        // Subtle screen flicker
        const flickerInterval = setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance every 5 seconds
                const flickerDuration = 100 + Math.random() * 200; // Random duration between 100-300ms

                const flickerElement = document.querySelector(`.${styles.flickerEffect}`);
                if (flickerElement) {
                    flickerElement.classList.add(styles.active);

                    setTimeout(() => {
                        flickerElement.classList.remove(styles.active);
                    }, flickerDuration);
                }
            }
        }, 5000);

        return () => clearInterval(flickerInterval);
    }, [effects.flicker]);

    return (
        <div className={styles.crtEffectsContainer} aria-hidden="true">
            {/* Scanlines */}
            {effects.scanlines && <div className={styles.scanlines}></div>}

            {/* Vignette (darkened corners) */}
            {effects.vignette && <div className={styles.vignette}></div>}

            {/* Noise overlay */}
            {effects.noise && <div className={styles.noise}></div>}

            {/* Flicker effect */}
            {effects.flicker && <div className={styles.flickerEffect}></div>}

            {/* Random glitch effect */}
            {effects.glitch && <div className={styles.glitchEffect}></div>}

            {/* Screen curvature */}
            {effects.curvature && <div className={styles.curvature}></div>}
        </div>
    );
};

export default CrtEffects;