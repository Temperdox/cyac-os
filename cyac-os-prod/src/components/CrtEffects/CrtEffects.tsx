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
}

// Props for the CrtEffects component
interface CrtEffectsProps {
    isHardwareAccelerated: boolean;
}

const CrtEffects: React.FC<CrtEffectsProps> = ({ isHardwareAccelerated }) => {
    // State for settings modal visibility
    const [showSettings, setShowSettings] = useState<boolean>(false);

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
        scrollLine: true  // Green scan line enabled by default
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
                setEffects(JSON.parse(savedSettings));
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

    // Save settings to localStorage whenever they change
    useEffect(() => {
        if (!isFirstLoad.current) {
            try {
                localStorage.setItem('crtEffectsSettings', JSON.stringify(effects));
            } catch (error) {
                console.error('Error saving CRT settings:', error);
            }
        }
    }, [effects]);

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
                    greenLineRef.current.style.animation = 'scrollLine 8s linear infinite';
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
                message: 'Hardware acceleration is disabled. CRT effects have been automatically disabled to improve performance.',
                duration: 6000
            });
            hasShowedHardwareWarning.current = true;

            // Disable effects when no hardware acceleration
            setEffects(prev => ({
                ...prev,
                enabled: false
            }));
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
                    const flickerElement = document.querySelector(`.${styles.flickerEffect}`) as HTMLElement;
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

    // Toggle individual effect
    const toggleEffect = (effectName: keyof CrtEffectOptions) => {
        setEffects(prev => ({
            ...prev,
            [effectName]: !prev[effectName]
        }));
    };

    // Toggle all effects
    const toggleAllEffects = () => {
        // Don't enable effects if hardware acceleration is off
        if (!isHardwareAccelerated && !effects.enabled) {
            ToastManager.show({
                type: 'warning',
                message: 'CRT effects cannot be enabled when hardware acceleration is disabled.',
                duration: 5000
            });
            return;
        }

        const newEnabled = !effects.enabled;
        setEffects(prev => ({
            ...prev,
            enabled: newEnabled
        }));
    };

    // Close settings modal when clicking outside
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setShowSettings(false);
        }
    };

    // Only render effects if hardware acceleration is available or skip the intensive ones
    const shouldRenderIntensiveEffects = isHardwareAccelerated && effects.enabled;
    const shouldRenderBasicEffects = effects.enabled;

    return (
        <>
            {/* CRT Effects Container */}
            <div className={styles.crtEffectsContainer}>
                {shouldRenderBasicEffects && effects.scanlines && <div className={styles.scanlines}></div>}
                {shouldRenderBasicEffects && effects.darkScanlines && <div className={styles.darkScanlines}></div>}
                {shouldRenderBasicEffects && effects.verticalLines && <div className={styles.verticalScanlines}></div>}
                {shouldRenderBasicEffects && effects.vignette && <div className={styles.vignette}></div>}
                {shouldRenderBasicEffects && effects.glow && <div className={styles.glowEffect}></div>}
                {shouldRenderBasicEffects && effects.noise && <div className={styles.noise}></div>}
                {shouldRenderIntensiveEffects && effects.flicker && <div className={styles.flickerEffect}></div>}
                {shouldRenderIntensiveEffects && effects.glitch && <div className={styles.glitchEffect}></div>}
                {shouldRenderIntensiveEffects && effects.curvature && <div className={styles.curvature}></div>}

                {/* Green scrolling line */}
                {shouldRenderBasicEffects && effects.scrollLine && (
                    <div ref={greenLineRef} className={styles.scrollLine}></div>
                )}
            </div>

            {/* Settings Button */}
            <button
                className={styles.settingsButton}
                onClick={() => setShowSettings(true)}
                title="CRT Effects Settings"
            >
                CRT {effects.enabled ? 'ON' : 'OFF'}
            </button>

            {/* Settings Modal */}
            {showSettings && (
                <div className={styles.settingsOverlay} onClick={handleOverlayClick}>
                    <div className={styles.settingsModal}>
                        <div className={styles.settingsHeader}>
                            <h3>CRT Effects Settings</h3>
                            <button
                                className={styles.closeButton}
                                onClick={() => setShowSettings(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className={styles.settingsContent}>
                            <div className={styles.settingItem}>
                                <label className={styles.masterToggle}>
                                    <input
                                        type="checkbox"
                                        checked={effects.enabled}
                                        onChange={toggleAllEffects}
                                        disabled={!isHardwareAccelerated && !effects.enabled}
                                    />
                                    Master Toggle (All Effects)
                                </label>
                                {!isHardwareAccelerated && (
                                    <div className={styles.hardwareWarning}>
                                        Hardware acceleration is disabled. CRT effects may affect performance.
                                    </div>
                                )}
                            </div>

                            <div className={styles.settingsDivider}></div>

                            <div className={styles.settingsList}>
                                <div className={styles.settingItem}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={effects.scanlines}
                                            onChange={() => toggleEffect('scanlines')}
                                            disabled={!effects.enabled}
                                        />
                                        Light Scanlines
                                    </label>
                                </div>

                                <div className={styles.settingItem}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={effects.darkScanlines}
                                            onChange={() => toggleEffect('darkScanlines')}
                                            disabled={!effects.enabled}
                                        />
                                        Dark Scanlines
                                    </label>
                                </div>

                                <div className={styles.settingItem}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={effects.scrollLine}
                                            onChange={() => toggleEffect('scrollLine')}
                                            disabled={!effects.enabled}
                                        />
                                        Green Scrolling Line
                                    </label>
                                </div>

                                <div className={styles.settingItem}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={effects.verticalLines}
                                            onChange={() => toggleEffect('verticalLines')}
                                            disabled={!effects.enabled}
                                        />
                                        Vertical Lines
                                    </label>
                                </div>

                                <div className={styles.settingItem}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={effects.vignette}
                                            onChange={() => toggleEffect('vignette')}
                                            disabled={!effects.enabled}
                                        />
                                        Vignette (Darkened Corners)
                                    </label>
                                </div>

                                <div className={styles.settingItem}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={effects.glow}
                                            onChange={() => toggleEffect('glow')}
                                            disabled={!effects.enabled}
                                        />
                                        Green Glow
                                    </label>
                                </div>

                                <div className={styles.settingItem}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={effects.noise}
                                            onChange={() => toggleEffect('noise')}
                                            disabled={!effects.enabled}
                                        />
                                        Noise Overlay
                                    </label>
                                </div>

                                <div className={styles.settingItem}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={effects.flicker}
                                            onChange={() => toggleEffect('flicker')}
                                            disabled={!effects.enabled || !isHardwareAccelerated}
                                        />
                                        Screen Flicker
                                        {!isHardwareAccelerated && <span className={styles.intensive}> (Requires HW Accel.)</span>}
                                    </label>
                                </div>

                                <div className={styles.settingItem}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={effects.glitch}
                                            onChange={() => toggleEffect('glitch')}
                                            disabled={!effects.enabled || !isHardwareAccelerated}
                                        />
                                        Random Glitches
                                        {!isHardwareAccelerated && <span className={styles.intensive}> (Requires HW Accel.)</span>}
                                    </label>
                                </div>

                                <div className={styles.settingItem}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={effects.curvature}
                                            onChange={() => toggleEffect('curvature')}
                                            disabled={!effects.enabled || !isHardwareAccelerated}
                                        />
                                        Screen Curvature
                                        {!isHardwareAccelerated && <span className={styles.intensive}> (Requires HW Accel.)</span>}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className={styles.settingsFooter}>
                            <button
                                className={styles.applyButton}
                                onClick={() => setShowSettings(false)}
                            >
                                Apply Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CrtEffects;