import React, { useState, useEffect, useRef, useMemo } from 'react';
import styles from './ConnectionAnimation.module.css';

interface ConnectionAnimationProps {
    url: string;
    onComplete: () => void;
}

const ConnectionAnimation: React.FC<ConnectionAnimationProps> = ({ url, onComplete }) => {
    const [animationStage, setAnimationStage] = useState(0);
    const [displayText, setDisplayText] = useState('');
    const [showWarning, setShowWarning] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    // Refs for timers & mount status
    const timersRef = useRef<number[]>([]);
    const isMountedRef = useRef(true);

    // Helper to add a timer
    const addTimer = (id: number) => {
        timersRef.current.push(id);
        return id;
    };

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            timersRef.current.forEach(id => clearTimeout(id));
            timersRef.current = [];
        };
    }, []);

    // Detect reduced-motion preference
    useEffect(() => {
        if (window.matchMedia) {
            const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
            setPrefersReducedMotion(mq.matches);
            const handler = (e: MediaQueryListEvent) => {
                if (isMountedRef.current) setPrefersReducedMotion(e.matches);
            };
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        }
    }, []);

    // Simplify URL for display
    const getDisplayUrl = (full: string) => {
        try {
            const u = new URL(full.startsWith('http') ? full : `https://${full}`);
            return u.hostname;
        } catch {
            return full;
        }
    };
    const displayUrl = getDisplayUrl(url).toUpperCase();

    // Build & memoize stages array so it doesn't get recreated each render
    const stages = useMemo(() => {
        const base = [
            { id: 'init',    text: 'INITIALIZING CONNECTION...',           delay: 1200 },
            { id: 'scan',    text: 'SCANNING HOST...',                     delay: 800  },
            { id: 'tunnel',  text: 'ESTABLISHING SECURE TUNNEL...',        delay: 150 },
            { id: 'connect', text: `CONNECTING TO ${displayUrl}...`,       delay: 100 },
            { id: 'warning', text: 'WARNING! EXTERNAL CONNECTION NOT SECURE!', delay: 1000, warning: true },
            { id: 'prompt',  text: 'PROCEED ANYWAY? Y/N...',                delay: 800,  warning: true },
            { id: 'override',text: 'OVERRIDE SECURITY PROTOCOL...',         delay: 1200 },
            { id: 'final',   text: 'CONNECTING TO EXTERNAL NETWORK...',     delay: 150 },
            { id: 'success', text: 'CONNECTION ESTABLISHED SUCCESSFULLY',   delay: 100, success: true },
        ];

        if (prefersReducedMotion) {
            // cap delays at 600ms for reduced motion
            return base.map(s => ({ ...s, delay: Math.min(s.delay, 600) }));
        }
        return base;
    }, [prefersReducedMotion, displayUrl]);

    // Log stage changes
    useEffect(() => {
        console.log(`Stage ${animationStage} of ${stages.length} (${stages[animationStage]?.id || 'done'})`);
    }, [animationStage, stages.length]);

    // Typewriter + stage progression
    useEffect(() => {
        if (!isMountedRef.current) return;

        // If beyond last stage, finalize
        if (animationStage >= stages.length) {
            const finishTimer = addTimer(window.setTimeout(() => {
                if (isMountedRef.current) onComplete();
            }, prefersReducedMotion ? 400 : 800));
            return () => clearTimeout(finishTimer);
        }

        const { text: targetText, delay, warning } = stages[animationStage];
        setShowWarning(!!warning);

        // Reduced-motion: show full text immediately
        if (prefersReducedMotion) {
            setDisplayText(targetText);
            const moveTimer = addTimer(window.setTimeout(() => {
                if (isMountedRef.current) setAnimationStage(s => s + 1);
            }, delay));
            return () => clearTimeout(moveTimer);
        }

        // Normal typewriter
        let idx = 0;
        const typingSpeed = 25;

        const typeNext = () => {
            if (!isMountedRef.current) return;

            if (idx <= targetText.length) {
                setDisplayText(targetText.slice(0, idx++));
                const t = window.setTimeout(typeNext, typingSpeed);
                addTimer(t);
            } else {
                const nextTimer = window.setTimeout(() => {
                    if (isMountedRef.current) setAnimationStage(s => s + 1);
                }, delay);
                addTimer(nextTimer);
            }
        };

        typeNext();
    }, [animationStage, onComplete, prefersReducedMotion, stages.length]);

    return (
        <div className={styles.connectionAnimation}>
            <div className={styles.crtScreen}>
                {!prefersReducedMotion && (
                    <>
                        <div className={styles.scanlines}></div>
                        <div className={styles.flicker}></div>
                    </>
                )}

                <div className={styles.terminal}>
                    <div className={`${styles.prompt} ${showWarning ? styles.warning : ''}`}>
                        <span className={styles.cursor}>&gt;</span> {displayText}
                        <span className={styles.blinkingCursor}>_</span>
                    </div>

                    {animationStage < stages.length && (
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${(animationStage / stages.length) * 100}%` }}
                            />
                        </div>
                    )}

                    <div className={styles.connectionDiagram}>
                        <div className={styles.node}></div>
                        <div className={`${styles.connectionLine} ${animationStage > 3 ? styles.active : ''}`}></div>
                        <div className={`${styles.warningIcon} ${showWarning ? styles.visible : ''}`}>!</div>
                        <div className={`${styles.node} ${animationStage >= stages.length - 1 ? styles.connected : ''}`}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConnectionAnimation;
