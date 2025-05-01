import React, { useState, useEffect } from 'react';
import styles from './LevelSelect.module.css';
import { Level, PlayerData } from '../types';
import { hasCompletedLevel, getLevelBestScore } from '../utils/playerUtils';

interface LevelSelectProps {
    levels: Level[];
    playerData: PlayerData;
    onSelectLevel: (level: Level) => void;
    onBack: () => void;
}

const LevelSelect: React.FC<LevelSelectProps> = ({ levels, playerData, onSelectLevel, onBack }) => {
    const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
    const [filteredLevels, setFilteredLevels] = useState<Level[]>([]);
    const [filter, setFilter] = useState<string>('all');

    // Initial filtering and sorting of levels
    useEffect(() => {
        // Sort levels by order
        const sortedLevels = [...levels].sort((a, b) => a.order - b.order);

        // Apply filter
        let filtered: Level[];
        switch (filter) {
            case 'completed':
                filtered = sortedLevels.filter(level =>
                    hasCompletedLevel(playerData, level.id)
                );
                break;
            case 'uncompleted':
                filtered = sortedLevels.filter(level =>
                    !hasCompletedLevel(playerData, level.id)
                );
                break;
            case 'locked':
                filtered = sortedLevels.filter(level =>
                    level.requirements && level.requirements.completedLevels &&
                    level.requirements.completedLevels.some(reqLevel =>
                        !hasCompletedLevel(playerData, reqLevel)
                    )
                );
                break;
            case 'all':
            default:
                filtered = sortedLevels;
                break;
        }

        setFilteredLevels(filtered);
    }, [levels, playerData, filter]);

    // Check if a level is locked
    const isLevelLocked = (level: Level): boolean => {
        if (!level.requirements) return false;

        // Check player level requirement
        if (level.requirements.playerLevel && playerData.level < level.requirements.playerLevel) {
            return true;
        }

        // Check completed levels requirement
        if (level.requirements.completedLevels && level.requirements.completedLevels.length > 0) {
            for (const reqLevelId of level.requirements.completedLevels) {
                if (!hasCompletedLevel(playerData, reqLevelId)) {
                    return true;
                }
            }
        }

        // Check points requirement
        if (level.requirements.points && playerData.points < level.requirements.points) {
            return true;
        }

        // Check items requirement
        if (level.requirements.items && level.requirements.items.length > 0) {
            for (const itemId of level.requirements.items) {
                if (!playerData.inventory.some(item => item.id === itemId)) {
                    return true;
                }
            }
        }

        return false;
    };

    // Get the lock reason for a level
    const getLockReason = (level: Level): string => {
        if (!level.requirements) return '';

        if (level.requirements.playerLevel && playerData.level < level.requirements.playerLevel) {
            return `Requires Level ${level.requirements.playerLevel}`;
        }

        if (level.requirements.completedLevels && level.requirements.completedLevels.length > 0) {
            const missingLevels = level.requirements.completedLevels.filter(
                reqLevelId => !hasCompletedLevel(playerData, reqLevelId)
            );

            if (missingLevels.length > 0) {
                const missingNames = missingLevels.map(id => {
                    const level = levels.find(l => l.id === id);
                    return level ? level.name : id;
                });

                return `Complete: ${missingNames.join(', ')}`;
            }
        }

        if (level.requirements.points && playerData.points < level.requirements.points) {
            return `Requires ${level.requirements.points} cR`;
        }

        if (level.requirements.items && level.requirements.items.length > 0) {
            const missingItems = level.requirements.items.filter(
                itemId => !playerData.inventory.some(item => item.id === itemId)
            );

            if (missingItems.length > 0) {
                return `Missing required items`;
            }
        }

        return '';
    };

    // Determine level status for styling
    const getLevelStatus = (level: Level): 'locked' | 'available' | 'completed' => {
        if (isLevelLocked(level)) return 'locked';
        if (hasCompletedLevel(playerData, level.id)) return 'completed';
        return 'available';
    };

    // Handle level selection
    const handleLevelSelect = (level: Level) => {
        if (isLevelLocked(level)) return;

        setSelectedLevel(level);

        // Show level details, then after a short delay launch the level
        setTimeout(() => {
            onSelectLevel(level);
        }, 500);
    };

    return (
        <div className={styles.levelSelect}>
            <div className={styles.header}>
                <h2 className={styles.title}>SELECT MISSION</h2>
                <div className={styles.filterButtons}>
                    <button
                        className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`${styles.filterButton} ${filter === 'completed' ? styles.active : ''}`}
                        onClick={() => setFilter('completed')}
                    >
                        Completed
                    </button>
                    <button
                        className={`${styles.filterButton} ${filter === 'uncompleted' ? styles.active : ''}`}
                        onClick={() => setFilter('uncompleted')}
                    >
                        Available
                    </button>
                </div>
                <button className={styles.backButton} onClick={onBack}>
                    Back
                </button>
            </div>

            <div className={styles.levelGrid}>
                {filteredLevels.map(level => {
                    const status = getLevelStatus(level);
                    const bestScore = getLevelBestScore(playerData, level.id);
                    const scorePercent = Math.floor((bestScore / level.maxScore) * 100);

                    return (
                        <div
                            key={level.id}
                            className={`${styles.levelCard} ${styles[status]}`}
                            onClick={() => handleLevelSelect(level)}
                        >
                            <div className={styles.levelNumber}>{level.order}</div>
                            <div className={styles.levelInfo}>
                                <h3 className={styles.levelName}>{level.name}</h3>
                                <p className={styles.levelDesc}>{level.description}</p>
                                {status === 'completed' && (
                                    <div className={styles.levelScore}>
                                        <div className={styles.scoreBar}>
                                            <div
                                                className={styles.scoreProgress}
                                                style={{width: `${scorePercent}%`}}
                                            ></div>
                                        </div>
                                        <div className={styles.scoreValue}>{bestScore}/{level.maxScore}</div>
                                    </div>
                                )}
                                {status === 'locked' && (
                                    <div className={styles.lockReason}>
                                        {getLockReason(level)}
                                    </div>
                                )}
                                <div className={styles.levelDetails}>
                                    <span className={styles.levelType}>{level.type}</span>
                                    <span className={styles.levelDifficulty}>{level.difficulty}</span>
                                    {level.timeLimit && (
                                        <span className={styles.levelTime}>
                      {Math.floor(level.timeLimit / 60)}:{(level.timeLimit % 60).toString().padStart(2, '0')}
                    </span>
                                    )}
                                </div>
                            </div>
                            {status === 'locked' && (
                                <div className={styles.lockIcon}>🔒</div>
                            )}
                            {status === 'completed' && (
                                <div className={styles.completeIcon}>✓</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredLevels.length === 0 && (
                <div className={styles.noLevels}>
                    No levels match the current filter.
                </div>
            )}

            {selectedLevel && (
                <div className={styles.levelDetails}>
                    <h3>{selectedLevel.name}</h3>
                </div>
            )}
        </div>
    );
};

export default LevelSelect;