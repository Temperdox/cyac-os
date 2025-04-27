import React, { useState, useEffect } from 'react';
import styles from './CrtEffectsSettings.module.css';
import { useCrtEffects } from './CrtEffectsContext';

interface CrtEffectsSettingsProps {
    onBack: () => void;
}

const CrtEffectsSettings: React.FC<CrtEffectsSettingsProps> = ({ onBack }) => {
    const { effects, toggleEffect, toggleAllEffects } = useCrtEffects();
    const [isHardwareAccelerated, setIsHardwareAccelerated] = useState(true);

    // Check for hardware acceleration on component mount
    useEffect(() => {
        // Simple check for hardware acceleration
        // In a real application, you would use a more robust method
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        setIsHardwareAccelerated(!!gl);
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backButton} onClick={onBack}>
                    <span>◄</span> Back
                </button>
                <h2>CRT Effects Settings</h2>
            </div>

            <div className={styles.content}>
                <div className={styles.settingItem}>
                    <label className={styles.masterToggle}>
                        <input
                            type="checkbox"
                            checked={effects.enabled}
                            onChange={toggleAllEffects}
                            disabled={!isHardwareAccelerated && !effects.enabled}
                        />
                        <span className={styles.toggleText}>Master Toggle (All Effects)</span>
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
                            <span className={styles.toggleText}>Scanlines</span>
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
                            <span className={styles.toggleText}>Vertical Lines</span>
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
                            <span className={styles.toggleText}>Vignette (Darkened Corners)</span>
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
                            <span className={styles.toggleText}>Green Glow</span>
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
                            <span className={styles.toggleText}>
                                Screen Flicker
                                {!isHardwareAccelerated && <span className={styles.intensive}> (Requires HW Accel.)</span>}
                            </span>
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
                            <span className={styles.toggleText}>
                                Random Glitches
                                {!isHardwareAccelerated && <span className={styles.intensive}> (Requires HW Accel.)</span>}
                            </span>
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
                            <span className={styles.toggleText}>
                                Screen Curvature
                                {!isHardwareAccelerated && <span className={styles.intensive}> (Requires HW Accel.)</span>}
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                <div className={styles.note}>
                    Note: Some effects may impact performance on older devices.
                </div>
            </div>
        </div>
    );
};

export default CrtEffectsSettings;