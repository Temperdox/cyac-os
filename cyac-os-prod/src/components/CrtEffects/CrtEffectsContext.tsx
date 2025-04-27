import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Interface for CRT effect options
interface CrtEffectOptions {
    enabled: boolean;
    scanlines: boolean;
    verticalLines: boolean;
    vignette: boolean;
    glow: boolean;
    flicker: boolean;
    glitch: boolean;
    curvature: boolean;
    noise: boolean;
}

// Interface for the context
interface CrtEffectsContextType {
    effects: CrtEffectOptions;
    toggleEffect: (effectName: keyof CrtEffectOptions) => void;
    toggleAllEffects: () => void;
}

// Create the context with default values
const CrtEffectsContext = createContext<CrtEffectsContextType>({
    effects: {
        enabled: true,
        scanlines: true,
        verticalLines: true,
        vignette: true,
        glow: true,
        flicker: true,
        glitch: true,
        curvature: true,
        noise: true
    },
    toggleEffect: () => {},
    toggleAllEffects: () => {}
});

// Custom hook to use the context
export const useCrtEffects = () => useContext(CrtEffectsContext);

// Props for the provider component
interface CrtEffectsProviderProps {
    children: ReactNode;
}

// Provider component
export const CrtEffectsProvider: React.FC<CrtEffectsProviderProps> = ({ children }) => {
    // State for CRT effects settings
    const [effects, setEffects] = useState<CrtEffectOptions>({
        enabled: true,
        scanlines: true,
        verticalLines: true,
        vignette: true,
        glow: true,
        flicker: true,
        glitch: true,
        curvature: true,
        noise: true
    });

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
    }, []);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('crtEffectsSettings', JSON.stringify(effects));
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

    // Create the context value
    const contextValue: CrtEffectsContextType = {
        effects,
        toggleEffect,
        toggleAllEffects
    };

    return (
        <CrtEffectsContext.Provider value={contextValue}>
            {children}
        </CrtEffectsContext.Provider>
    );
};

export default CrtEffectsContext;