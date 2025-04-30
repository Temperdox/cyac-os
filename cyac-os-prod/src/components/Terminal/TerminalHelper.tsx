import React, { useState, useEffect, useRef } from 'react';
import styles from './TerminalHelper.module.css';

interface TerminalHelperProps {
    gifPath: string;
    tips: string[];
}

const TerminalHelper: React.FC<TerminalHelperProps> = ({ gifPath, tips }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showTip, setShowTip] = useState(false);
    const [_currentTip, setCurrentTip] = useState('');
    const [typedText, setTypedText] = useState('');
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const tipTimerRef = useRef<NodeJS.Timeout | null>(null);
    const typeTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Handle typewriter effect
    useEffect(() => {
        if (showTip) {
            let text = tips[currentTipIndex];
            let currentIndex = 0;

            // Clear any existing interval
            if (typeTimerRef.current) {
                clearInterval(typeTimerRef.current);
            }

            setTypedText('');

            // Start the typewriter effect
            typeTimerRef.current = setInterval(() => {
                if (currentIndex < text.length) {
                    setTypedText(prev => prev + text.charAt(currentIndex));
                    currentIndex++;
                } else {
                    if (typeTimerRef.current) {
                        clearInterval(typeTimerRef.current);
                    }
                }
            }, 40); // Speed of typing

            // Auto-hide the tip after 5 seconds
            tipTimerRef.current = setTimeout(() => {
                setShowTip(false);
            }, 5000);
        }

        return () => {
            if (tipTimerRef.current) {
                clearTimeout(tipTimerRef.current);
            }
            if (typeTimerRef.current) {
                clearInterval(typeTimerRef.current);
            }
        };
    }, [showTip, currentTipIndex, tips]);

    const handleClick = () => {
        // Select a random tip or cycle through tips
        const nextTipIndex = (currentTipIndex + 1) % tips.length;
        setCurrentTipIndex(nextTipIndex);
        setCurrentTip(tips[nextTipIndex]);
        setShowTip(true);
    };

    return (
        <div className={styles.helperContainer}>
            <div
                className={`${styles.gifContainer} ${isHovered ? styles.hovered : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleClick}
            >
                <img
                    src={gifPath}
                    alt="Terminal Helper"
                    className={styles.helperGif}
                />
            </div>

            {showTip && (
                <div className={styles.speechBubble}>
                    <div className={styles.speechText}>{typedText}</div>
                </div>
            )}
        </div>
    );
};

export default TerminalHelper;