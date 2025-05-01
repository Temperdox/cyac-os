import React, { useState, useEffect } from 'react';
import styles from './LevelCompleteScreen.module.css';
import { Level } from '../types';

interface LevelCompleteScreenProps {
    level: Level | null;
    pointsEarned: number;
    onContinue: () => void;
    onRetry: () => void;
}

const LevelCompleteScreen: React.FC<LevelCompleteScreenProps> = ({
                                                                     level,
                                                                     pointsEarned,
                                                                     onContinue,
                                                                     onRetry
                                                                 }) => {
    const [showStats, setShowStats] = useState<boolean>(false);
    const [counters, setCounters] = useState({
        points: 0,
        levelProgress: 0
    });

    useEffect(() => {
        // Show mission complete message first
        const statsTimer = setTimeout(() => {
            setShowStats(true);
        }, 1000);

        return () => clearTimeout(statsTimer);
    }, []);

    // Animate the counters
    useEffect(() => {
        if (!showStats) return;

        const pointsDuration = 2000; // 2 seconds for points counter
        const pointsIncrement = Math.ceil(pointsEarned / (pointsDuration / 50)); // Increment every 50ms

        const progressDuration = 1500; // 1.5 seconds for progress counter
        const progressIncrement = 100 / (progressDuration / 50); // Increment every 50ms

        // For points counter
        const pointsInterval = setInterval(() => {
            setCounters(prev => {
                const newPoints = Math.min(prev.points + pointsIncrement, pointsEarned);

                if (newPoints >= pointsEarned) {
                    clearInterval(pointsInterval);
                }

                return {
                    ...prev,
                    points: newPoints
                };
            });
        }, 50);

        // For progress counter
        const progressInterval = setInterval(() => {
            setCounters(prev => {
                const newProgress = Math.min(prev.levelProgress + progressIncrement, 100);

                if (newProgress >= 100) {
                    clearInterval(progressInterval);
                }

                return {
                    ...prev,
                    levelProgress: newProgress
                };
            });
        }, 50);

        return () => {
            clearInterval(pointsInterval);
            clearInterval(progressInterval);
        };
    }, [showStats, pointsEarned]);

    return (
        <div className={styles.levelCompleteScreen}>
            <div className={styles.contentContainer}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        <span className={styles.titlePart}>MISSION</span>
                        <span className={styles.titleHighlight}>COMPLETE</span>
                    </h2>
                    {level && (
                        <h3 className={styles.missionName}>
                            {level.name}
                        </h3>
                    )}
                </div>

                {showStats && (
                    <div className={styles.statsContainer}>
                        <div className={styles.rewardSection}>
                            <div className={styles.rewardTitle}>MISSION REWARDS</div>
                            <div className={styles.rewardItem}>
                                <div className={styles.rewardLabel}>Credits Earned:</div>
                                <div className={styles.rewardValue}>
                                    <span className={styles.pointsCounter}>{Math.floor(counters.points)}</span> cR
                                </div>
                            </div>

                            {level && level.rewards.items && level.rewards.items.length > 0 && (
                                <div className={styles.rewardItem}>
                                    <div className={styles.rewardLabel}>Items Unlocked:</div>
                                    <div className={styles.rewardValue}>
                                        {level.rewards.items.length} new item(s)
                                    </div>
                                </div>
                            )}

                            {level && level.rewards.unlocks && level.rewards.unlocks.length > 0 && (
                                <div className={styles.rewardItem}>
                                    <div className={styles.rewardLabel}>Levels Unlocked:</div>
                                    <div className={styles.rewardValue}>
                                        {level.rewards.unlocks.length} new level(s)
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.progressSection}>
                            <div className={styles.progressTitle}>OPERATION STATUS</div>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${counters.levelProgress}%` }}
                                ></div>
                            </div>
                            <div className={styles.progressLabel}>
                                Mission Successful
                            </div>
                        </div>

                        <div className={styles.statsButtons}>
                            <button
                                className={`${styles.statsButton} ${styles.retryButton}`}
                                onClick={onRetry}
                            >
                                Retry Mission
                            </button>
                            <button
                                className={`${styles.statsButton} ${styles.continueButton}`}
                                onClick={onContinue}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {!showStats && (
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner}></div>
                        <div className={styles.loadingText}>Calculating Results...</div>
                    </div>
                )}
            </div>

            <div className={styles.backgroundElements}>
                <div className={styles.leftCircuit}></div>
                <div className={styles.rightCircuit}></div>
                <div className={styles.grid}></div>
            </div>
        </div>
    );
};

export default LevelCompleteScreen;