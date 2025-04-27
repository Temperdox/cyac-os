import React, { useState, useEffect, useRef } from 'react';
import styles from './HomeScreen.module.css';
import DiscordButton from '../DiscordButton/DiscordButton';

interface HomeScreenProps {
    // Add any props here if needed
}

declare global {
    interface Window {
        SimplexNoise: any;
    }
}

const HomeScreen: React.FC<HomeScreenProps> = () => {
    // Canvas reference for drawing
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const simplexRef = useRef<any>(null);
    const animationRef = useRef<number | null>(null);
    const timeRef = useRef<number>(0);
    const modifiersRef = useRef<any[]>([]);

    // State for dot pattern visibility
    const [isDotPatternVisible, setIsDotPatternVisible] = useState<boolean>(true);

    // State for animated text
    const [showCommandHint, setShowCommandHint] = useState<boolean>(false);
    const [mottoIndex, setMottoIndex] = useState<number>(0);

    // CyberAcme mottos that rotate
    const mottos = [
        "RUN THE CODE. RUN THE WORLD.",
        "TOMORROW'S TECH TODAY.",
        "SECURE. EFFICIENT. UNSTOPPABLE.",
        "BEYOND REALITY. BEYOND LIMITS.",
        "THE FUTURE IS OUR CODE.",
        "ESCAPE WILL MAKE ME TOTALITY.",
        "KEEP IT CLEAN."
    ];

    // Show command hint after delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowCommandHint(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    // Rotate mottos periodically
    useEffect(() => {
        const mottoTimer = setInterval(() => {
            setMottoIndex((prev) => (prev + 1) % mottos.length);
        }, 5000);

        return () => clearInterval(mottoTimer);
    }, []);

    // Listen for CRT settings changes
    useEffect(() => {
        // Check initial settings from localStorage
        try {
            const savedSettings = localStorage.getItem('crtEffectsSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                setIsDotPatternVisible(settings.enabled && settings.dotPattern);
            }
        } catch (error) {
            console.error('Error loading CRT settings:', error);
        }

        // Listen for changes to CRT settings
        const handleSettingsChanged = (e: CustomEvent) => {
            if (e.detail) {
                const settings = e.detail as any;
                setIsDotPatternVisible(settings.enabled && settings.dotPattern);
            }
        };

        window.addEventListener('crtEffectsSettingsChanged',
            handleSettingsChanged as EventListener);

        return () => {
            window.removeEventListener('crtEffectsSettingsChanged',
                handleSettingsChanged as EventListener);
        };
    }, []);

    // Initialize the dot pattern
    useEffect(() => {
        if (!isDotPatternVisible) {
            // If pattern is disabled, cancel animation and return
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }

            // Clear canvas if it exists
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }

            return;
        }

        // Load the SimplexNoise library
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/simplex-noise/2.4.0/simplex-noise.min.js';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            // Ensure window.SimplexNoise is defined
            if (typeof window.SimplexNoise !== 'undefined') {
                simplexRef.current = new window.SimplexNoise();
                initDotPattern();
                console.log("SimplexNoise initialized successfully");
            } else {
                console.error("SimplexNoise not defined after loading script");
            }
        };

        script.onerror = () => {
            console.error("Failed to load SimplexNoise script");
        };

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isDotPatternVisible]);

    // Add a new height map modifier at the click position
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDotPatternVisible) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Add the modifier directly to the ref
        modifiersRef.current.push({
            x,
            y,
            radius: 0,
            maxRadius: 300,
            peakStrength: 0.8,
            growthSpeed: 6,
            life: 1.0,
            decayRate: 0.01
        });
    };

    // Calculate modifier effect at a point
    const getModifierEffect = (x: number, y: number) => {
        let effect = 0;

        for (const mod of modifiersRef.current) {
            const dx = x - mod.x;
            const dy = y - mod.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Effect is strongest along the expanding edge
            const distanceToEdge = Math.abs(distance - mod.radius);
            const falloffWidth = 40;

            if (distanceToEdge <= falloffWidth) {
                // Gaussian falloff
                const falloff = Math.exp(-(distanceToEdge * distanceToEdge) / (2 * (falloffWidth/3) * (falloffWidth/3)));
                effect += mod.peakStrength * falloff * mod.life;
            }
        }

        return effect;
    };

    // Update all modifiers
    const updateModifiers = () => {
        for (let i = modifiersRef.current.length - 1; i >= 0; i--) {
            const mod = modifiersRef.current[i];

            // Expand radius
            mod.radius += mod.growthSpeed;

            // Decrease life
            mod.life -= mod.decayRate;

            // Remove dead modifiers
            if (mod.life <= 0 || mod.radius >= mod.maxRadius) {
                modifiersRef.current.splice(i, 1);
            }
        }
    };

    // Initialize the dot pattern
    const initDotPattern = () => {
        const canvas = canvasRef.current;
        if (!canvas || !window.SimplexNoise) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.offsetWidth;
                canvas.height = canvas.parentElement.offsetHeight;
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Animation parameters
        const dotSize = 2;
        const dotColor = '#33ff33';
        const dotDensity = 20;
        const noiseThreshold = 0.1;
        const speed = 0.0025;

        // Animation loop
        const draw = () => {
            if (!canvas || !simplexRef.current || !ctx || !isDotPatternVisible) {
                animationRef.current = requestAnimationFrame(draw);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update modifiers
            updateModifiers();

            // Draw dots
            for (let x = 0; x < canvas.width; x += dotDensity) {
                for (let y = 0; y < canvas.height; y += dotDensity) {
                    // Generate base noise
                    const baseNoise = simplexRef.current.noise3D(x * 0.008, y * 0.008, timeRef.current);

                    // Get modifier effect
                    const modification = getModifierEffect(x, y);

                    // Modified noise
                    const modifiedNoise = baseNoise + modification;

                    // Draw dots above threshold
                    if (modifiedNoise > noiseThreshold) {
                        // Calculate opacity
                        const opacity = Math.min(1, Math.max(0, (modifiedNoise - noiseThreshold) * 2));

                        // Size varies with modification
                        const finalSize = dotSize * (1 + modification * 0.5);

                        // Draw dot
                        ctx.beginPath();
                        ctx.arc(x, y, finalSize, 0, Math.PI * 2);
                        ctx.fillStyle = `${dotColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
                        ctx.fill();
                    }
                }
            }

            // Update time
            timeRef.current += speed;

            // Continue animation
            animationRef.current = requestAnimationFrame(draw);
        };

        // Start animation
        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    };

    return (
        <div className={styles.homeScreen}>
            {/* Dot pattern canvas - conditionally displayed */}
            {isDotPatternVisible && (
                <canvas
                    ref={canvasRef}
                    className={styles.dotPattern}
                    onClick={handleCanvasClick}
                />
            )}

            <div className={styles.logoContainer}>
                <div className={styles.logo}>CYBERACME</div>
                <div className={styles.logoUnderline}></div>
            </div>

            <div className={styles.mottoContainer}>
                <div className={styles.motto}>{mottos[mottoIndex]}</div>
            </div>

            <div className={styles.messageContainer}>
                <div className={styles.message}>NO ACTIVE SCENE. USE TERMINAL TO NAVIGATE.</div>

                {showCommandHint && (
                    <div className={styles.commandHint}>
                        TRY "LS" THEN "CAT [SCENE_NAME]" TO LOAD A SCENE.
                    </div>
                )}
            </div>

            <div className={styles.separator}>
                <span className={styles.bracketLeft}>[</span>
                <div className={styles.separatorLine}></div>
                <span className={styles.bracketRight}>]</span>
            </div>

            <div className={styles.statusContainer}>
                <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>SYSTEM:</span>
                    <span className={`${styles.statusValue} ${styles.online}`}>ONLINE</span>
                </div>
                <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>SECURITY:</span>
                    <span className={`${styles.statusValue} ${styles.secure}`}>SECURE</span>
                </div>
                <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>ACCESS LEVEL:</span>
                    <span className={`${styles.statusValue} ${styles.admin}`}>ADMIN</span>
                </div>
            </div>

            {/* Discord Button */}
            <div className={styles.discordButtonWrapper}>
                <DiscordButton />
            </div>

            {/* Bottom hints */}
            <div className={styles.bottomHints}>
                <div className={styles.hint}>HINT: USE UP/DOWN ARROWS TO NAVIGATE COMMAND HISTORY</div>
                <div className={styles.hint}>HINT: SOME SCENES AND SUBSCENES REQUIRE AUTHENTICATION</div>
            </div>
        </div>
    );
};

export default HomeScreen;