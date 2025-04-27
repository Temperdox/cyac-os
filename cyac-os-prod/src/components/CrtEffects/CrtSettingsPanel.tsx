import React, { useState, useEffect } from 'react';
import styles from './CrtSettingsPanel.module.css';

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

interface CrtSettingsPanelProps {
    onBack: () => void;
}

const CrtSettingsPanel: React.FC<CrtSettingsPanelProps> = ({ onBack }) => {
    const [isHardwareAccelerated, setIsHardwareAccelerated] = useState(true);
    const [effects, setEffects] = useState<CrtEffectOptions>({
        enabled: true,
        scanlines: true,
        darkScanlines: true,
        verticalLines: true,
        vignette: true,
        glow: true,
        flicker: true,
        glitch: true,
        curvature: true,
        noise: true,
        scrollLine: true,
        dotPattern: true
    });

    // Load saved settings on mount
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

        // Check hardware acceleration
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        setIsHardwareAccelerated(!!gl);
    }, []);

    // Save settings whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('crtEffectsSettings', JSON.stringify(effects));

            // Dispatch a custom event to notify other components of setting changes
            const event = new CustomEvent('crtEffectsSettingsChanged', { detail: effects });
            window.dispatchEvent(event);
        } catch (error) {
            console.error('Error saving CRT settings:', error);
        }
    }, [effects]);

    // Toggle individual effect
    const toggleEffect = (effectName: keyof CrtEffectOptions) => {
        setEffects(prev => ({
            ...prev,
            [effectName]: !prev[effectName]
        }));
    };

    // Toggle all effects
    const toggleAllEffects = () => {
        const newEnabled = !effects.enabled;
        setEffects(prev => ({
            ...prev,
            enabled: newEnabled
        }));
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>CRT EFFECTS</h3>
            </div>

            <div className={styles.settingsList}>
                <div className={styles.settingItem}>
                    <label className={styles.masterToggle}>
                        <input
                            type="checkbox"
                            checked={effects.enabled}
                            onChange={toggleAllEffects}
                        />
                        <span>ENABLE CRT EFFECTS</span>
                    </label>
                    {!isHardwareAccelerated && (
                        <div className={styles.hardwareWarning}>
                            Hardware acceleration is disabled. Some effects may impact performance.
                        </div>
                    )}
                </div>

                <div className={styles.divider}></div>

                {/* Individual CRT effects */}
                <div className={styles.effectSection}>
                    <h4 className={styles.sectionTitle}>DISPLAY EFFECTS</h4>

                    <div className={styles.settingItem}>
                        <label>
                            <input
                                type="checkbox"
                                checked={effects.scanlines}
                                onChange={() => toggleEffect('scanlines')}
                                disabled={!effects.enabled}
                            />
                            <span>Light Scanlines</span>
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
                            <span>Dark Scanlines</span>
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
                            <span>Vertical Lines</span>
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
                            <span>Vignette Effect</span>
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
                            <span>Green Glow</span>
                        </label>
                    </div>
                </div>

                <div className={styles.effectSection}>
                    <h4 className={styles.sectionTitle}>ANIMATED EFFECTS</h4>

                    <div className={styles.settingItem}>
                        <label>
                            <input
                                type="checkbox"
                                checked={effects.scrollLine}
                                onChange={() => toggleEffect('scrollLine')}
                                disabled={!effects.enabled}
                            />
                            <span>Green Scan Line</span>
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
                            <span>Static Noise</span>
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
                            <span>Screen Flicker</span>
                            {!isHardwareAccelerated && <span className={styles.intensive}> (HW Accel. Required)</span>}
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
                            <span>Random Glitches</span>
                            {!isHardwareAccelerated && <span className={styles.intensive}> (HW Accel. Required)</span>}
                        </label>
                    </div>
                </div>

                <div className={styles.effectSection}>
                    <h4 className={styles.sectionTitle}>ADDITIONAL EFFECTS</h4>

                    <div className={styles.settingItem}>
                        <label>
                            <input
                                type="checkbox"
                                checked={effects.curvature}
                                onChange={() => toggleEffect('curvature')}
                                disabled={!effects.enabled || !isHardwareAccelerated}
                            />
                            <span>Screen Curvature</span>
                            {!isHardwareAccelerated && <span className={styles.intensive}> (HW Accel. Required)</span>}
                        </label>
                    </div>

                    <div className={styles.settingItem}>
                        <label>
                            <input
                                type="checkbox"
                                checked={effects.dotPattern}
                                onChange={() => toggleEffect('dotPattern')}
                                disabled={!effects.enabled}
                            />
                            <span>Home Screen Dot Pattern</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                <button className={styles.backButton} onClick={onBack}>
                    BACK
                </button>
            </div>
        </div>
    );
};

export default CrtSettingsPanel;