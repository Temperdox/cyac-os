import React, { useState, useEffect, useRef } from 'react';
import styles from './CrtEffects.module.css';
import { ToastManager } from '../../services/ToastManager';

// Interface for CRT effect options
interface CrtEffectOptions {
    enabled: boolean;
    scanlines: boolean;
    darkScanlines: boolean;
    verticalLines: boolean;
    vignette: boolean;
    glow: boolean;
    flicker: boolean;
    glitch: boolean;
    curvature: boolean;
    noise: boolean;
    scrollLine: boolean;
    dotPattern: boolean; // Added for HomeScreen dot pattern
}

// Props for the CrtEffects component
interface CrtEffectsProps {
    isHardwareAccelerated: boolean;
}

const CrtEffects: React.FC<CrtEffectsProps> = ({ isHardwareAccelerated }) => {
    // State for CRT effects settings
    const [effects, setEffects] = useState<CrtEffectOptions>({
        enabled: true,
        scanlines: true,
        darkScanlines: true, // Dark horizontal lines enabled by default
        verticalLines: true,
        vignette: true,
        glow: true,
        flicker: true,
        glitch: true,
        curvature: true,
        noise: true,
        scrollLine: true,  // Green scan line enabled by default
        dotPattern: true   // Home screen dot pattern
    });

    // Reference for the green line element
    const greenLineRef = useRef<HTMLDivElement>(null);

    // Ref for tracking initial load
    const isFirstLoad = useRef<boolean>(true);
    const hasShowedHardwareWarning = useRef<boolean>(false);

    // For glitch effect timing
    const glitchTimerRef = useRef<number | null>(null);
    const flickerTimerRef = useRef<number | null>(null);

    // Load saved settings from localStorage on component mount
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('crtEffectsSettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);

                // Add dotPattern if it doesn't exist in saved settings
                if (parsed.dotPattern === undefined) {
                    parsed.dotPattern = true;
                }

                setEffects(parsed);
            }
        } catch (error) {
            console.error('Error loading CRT settings:', error);
        }

        isFirstLoad.current = false;

        // Clean up timers on unmount
        return () => {
            if (glitchTimerRef.current) window.clearInterval(glitchTimerRef.current);
            if (flickerTimerRef.current) window.clearInterval(flickerTimerRef.current);
        };
    }, []);

    // Listen for settings changes from the CrtSettingsPanel component
    useEffect(() => {
        const handleSettingsChanged = (e: CustomEvent) => {
            if (e.detail) {
                setEffects(e.detail as CrtEffectOptions);
            }
        };

        // Add event listener for settings changes
        window.addEventListener('crtEffectsSettingsChanged',
            handleSettingsChanged as EventListener);

        return () => {
            window.removeEventListener('crtEffectsSettingsChanged',
                handleSettingsChanged as EventListener);
        };
    }, []);

    // Update the home screen dot pattern visibility based on settings
    useEffect(() => {
        if (!isFirstLoad.current) {
            // Find the HomeScreen dotPattern element
            const dotPatterns = document.querySelectorAll(`.${styles.dotPattern}, .homeScreen canvas`);

            dotPatterns.forEach(element => {
                if (element instanceof HTMLElement) {
                    element.style.display = effects.enabled && effects.dotPattern ? 'block' : 'none';
                }
            });
        }
    }, [effects.enabled, effects.dotPattern]);

    // Handle the green scrolling line effect
    useEffect(() => {
        if (effects.enabled && effects.scrollLine && greenLineRef.current) {
            const startAnimation = () => {
                if (greenLineRef.current) {
                    greenLineRef.current.style.top = '0';
                    greenLineRef.current.style.animation = 'none';

                    // Force reflow
                    void greenLineRef.current.offsetWidth;

                    // Start animation
                    greenLineRef.current.style.animation = `${styles.scrollLine} 8s linear infinite`;
                }
            };

            startAnimation();

            // Restart animation periodically to ensure it keeps running
            const intervalId = setInterval(startAnimation, 8000);

            return () => clearInterval(intervalId);
        }
    }, [effects.enabled, effects.scrollLine]);

    // Check hardware acceleration and show warning if needed
    useEffect(() => {
        if (!isHardwareAccelerated && effects.enabled && !hasShowedHardwareWarning.current) {
            ToastManager.show({
                type: 'warning',
                message: 'Hardware acceleration is disabled. CRT effects have been automatically reduced to improve performance.',
                duration: 6000
            });
            hasShowedHardwareWarning.current = true;

            // Disable intensive effects when no hardware acceleration
            if (effects.glitch || effects.flicker || effects.curvature) {
                setEffects(prev => ({
                    ...prev,
                    glitch: false,
                    flicker: false,
                    curvature: false
                }));
            }
        }
    }, [isHardwareAccelerated, effects.enabled]);

    // Manage glitch effect
    useEffect(() => {
        // Clear existing timer
        if (glitchTimerRef.current) {
            window.clearInterval(glitchTimerRef.current);
            glitchTimerRef.current = null;
        }

        if (effects.enabled && effects.glitch && isHardwareAccelerated) {
            // Create glitch effect at random intervals
            glitchTimerRef.current = window.setInterval(() => {
                if (Math.random() < 0.1) { // 10% chance to glitch
                    const glitchElement = document.querySelector(`.${styles.glitchEffect}`) as HTMLElement;
                    if (glitchElement) {
                        glitchElement.classList.add(styles.active);
                        setTimeout(() => {
                            glitchElement.classList.remove(styles.active);
                        }, 150 + Math.random() * 200); // Random duration between 150-350ms
                    }
                }
            }, 3000); // Check every 3 seconds
        }
    }, [effects.enabled, effects.glitch, isHardwareAccelerated]);

    // Manage flicker effect
    useEffect(() => {
        // Clear existing timer
        if (flickerTimerRef.current) {
            window.clearInterval(flickerTimerRef.current);
            flickerTimerRef.current = null;
        }

        if (effects.enabled && effects.flicker && isHardwareAccelerated) {
            // Create flicker effect at random intervals
            flickerTimerRef.current = window.setInterval(() => {
                if (Math.random() < 0.15) { // 15% chance to flicker
                    const flickerElement = document.querySelector(`.${styles.screenFlicker}`) as HTMLElement;
                    if (flickerElement) {
                        flickerElement.classList.add(styles.active);
                        setTimeout(() => {
                            flickerElement.classList.remove(styles.active);
                        }, 100 + Math.random() * 150); // Random duration
                    }
                }
            }, 5000); // Check every 5 seconds
        }
    }, [effects.enabled, effects.flicker, isHardwareAccelerated]);

    // Only render effects if hardware acceleration is available or skip the intensive ones
    const shouldRenderIntensiveEffects = isHardwareAccelerated && effects.enabled;
    const shouldRenderBasicEffects = effects.enabled;

    return (
        <div className={styles.crtEffects}>
            {shouldRenderBasicEffects && effects.scanlines && <div className={styles.scanlines}></div>}
            {shouldRenderBasicEffects && effects.darkScanlines && <div className={styles.darkScanlines}></div>}
            {shouldRenderBasicEffects && effects.verticalLines && <div className={styles.verticalScanlines}></div>}
            {shouldRenderBasicEffects && effects.vignette && <div className={styles.vignette}></div>}
            {shouldRenderBasicEffects && effects.glow && <div className={styles.glowEffect}></div>}
            {shouldRenderBasicEffects && effects.noise && <div className={styles.noise}></div>}
            {shouldRenderIntensiveEffects && effects.flicker && <div className={styles.screenFlicker}></div>}
            {shouldRenderIntensiveEffects && effects.glitch && <div className={styles.glitchEffect}></div>}
            {shouldRenderIntensiveEffects && effects.curvature && <div className={styles.barrelDistortion}></div>}

            {/* Green scrolling line */}
            {shouldRenderBasicEffects && effects.scrollLine && (
                <div ref={greenLineRef} className={styles.scrollLine}></div>
            )}
        </div>
    );
};

export default CrtEffects;