import React, { useState, useEffect } from 'react';
import styles from '../MiniGameComponent.module.css';
import passwordStyles from './PasswordCrackGame.module.css';
import { PlayerData } from '../../types';

interface PasswordCrackGameProps {
    gameData: any;
    onComplete: (success: boolean, score: number) => void;
    timeLeft: number;
    playerData: PlayerData;
}

const PasswordCrackGame: React.FC<PasswordCrackGameProps> = ({
                                                                 gameData,
                                                                 onComplete,
                                                                 timeLeft
                                                             }) => {
    // Game state
    const [password, setPassword] = useState<string>('');
    const [attempts, setAttempts] = useState<number>(0);
    const [maxAttempts, setMaxAttempts] = useState<number>(5);
    const [hint, setHint] = useState<string>('');
    const [inputValue, setInputValue] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');
    const [gameComplete, setGameComplete] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);

    // Initialize game data
    useEffect(() => {
        if (gameData) {
            // Get password from game data, or generate one
            const pwd = gameData.password || generatePassword();
            setPassword(pwd);

            // Set max attempts from game data or default
            setMaxAttempts(gameData.maxAttempts || 5);

            // Set initial hint if provided
            if (gameData.initialHint) {
                setHint(gameData.initialHint);
            } else if (gameData.cipher === 'Caesar') {
                const shift = gameData.shift || 3;
                setHint(`This password is encoded with a Caesar cipher with shift ${shift}.`);
            } else {
                // Default hint
                setHint('Enter the correct password to gain access to the system.');
            }
        }
    }, [gameData]);

    // Handle time running out
    useEffect(() => {
        if (timeLeft <= 0 && !gameComplete) {
            handleFailure();
        }
    }, [timeLeft, gameComplete]);

    // Handle password submission
    const handleSubmit = () => {
        if (gameComplete) return;

        const attempt = inputValue.trim().toUpperCase();
        setAttempts(prev => prev + 1);

        if (attempt === password.toUpperCase()) {
            handleSuccess();
        } else {
            if (attempts + 1 >= maxAttempts) {
                handleFailure();
            } else {
                // Provide feedback on incorrect attempt
                provideFeedback(attempt);
                setInputValue('');
            }
        }
    };

    // Generate feedback for incorrect attempts
    const provideFeedback = (attempt: string) => {
        if (gameData.cipher === 'Caesar') {
            // For Caesar cipher, check if any characters match
            let matches = 0;
            const target = password.toUpperCase();

            for (let i = 0; i < Math.min(attempt.length, target.length); i++) {
                if (attempt[i] === target[i]) {
                    matches++;
                }
            }

            const matchPercent = Math.floor((matches / target.length) * 100);
            setFeedback(`Authentication failed. Character match: ${matchPercent}%`);
        } else {
            // Generic feedback
            setFeedback(`Authentication failed. ${maxAttempts - attempts - 1} attempts remaining.`);
        }
    };

    // Handle successful completion
    const handleSuccess = () => {
        setSuccess(true);
        setGameComplete(true);

        // Calculate score based on remaining time and attempts
        const baseScore = gameData.baseScore || 100;
        const timeBonus = Math.floor((timeLeft / 30) * 50); // Up to 50 points for time
        const attemptPenalty = Math.floor(((attempts) / maxAttempts) * 30); // Up to 30 points penalty

        const finalScore = Math.max(baseScore + timeBonus - attemptPenalty, 0);
        setScore(finalScore);

        // After a delay, complete the game
        setTimeout(() => {
            onComplete(true, finalScore);
        }, 2000);
    };

    // Handle failure
    const handleFailure = () => {
        setSuccess(false);
        setGameComplete(true);

        // After a delay, fail the game
        setTimeout(() => {
            onComplete(false, 0);
        }, 2000);
    };

    // Generate a random password if none provided
    const generatePassword = (): string => {
        const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const length = 6 + Math.floor(Math.random() * 4); // 6-10 characters

        let result = '';
        for (let i = 0; i < length; i++) {
            result += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
        }

        return result;
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value.toUpperCase());
    };

    // Handle key press for Enter key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    // Render game content
    return (
        <div className={styles.gameContainer}>
            <div className={styles.gameInstructions}>
                {hint}
            </div>

            <div className={styles.gameContent}>
                <div className={passwordStyles.passwordCrackContainer}>
                    <div className={passwordStyles.terminalHeader}>
                        SECURITY ACCESS TERMINAL
                    </div>

                    <div className={passwordStyles.terminalContent}>
                        <div className={passwordStyles.terminalLine}>ENTER AUTHORIZATION CODE:</div>

                        {feedback && (
                            <div className={passwordStyles.terminalFeedback}>{feedback}</div>
                        )}

                        <div className={passwordStyles.inputContainer}>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className={passwordStyles.passwordInput}
                                placeholder="ENTER PASSWORD"
                                maxLength={20}
                                disabled={gameComplete}
                                autoFocus
                            />

                            <button
                                className={passwordStyles.submitButton}
                                onClick={handleSubmit}
                                disabled={gameComplete || !inputValue.trim()}
                            >
                                SUBMIT
                            </button>
                        </div>

                        <div className={passwordStyles.attemptsCounter}>
                            Attempts: {attempts}/{maxAttempts}
                        </div>
                    </div>
                </div>

                {/* Success overlay */}
                {gameComplete && success && (
                    <div className={styles.successOverlay}>
                        <div className={styles.overlayIcon}>✓</div>
                        <div className={styles.overlayMessage}>ACCESS GRANTED</div>
                        <div className={styles.overlayScore}>
                            Score: <span className={styles.scoreValue}>{score}</span>
                        </div>
                    </div>
                )}

                {/* Failure overlay */}
                {gameComplete && !success && (
                    <div className={styles.failureOverlay}>
                        <div className={styles.overlayIcon}>✗</div>
                        <div className={styles.overlayMessage}>ACCESS DENIED</div>
                        <div className={styles.correctPassword}>
                            Correct password: {password}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PasswordCrackGame;