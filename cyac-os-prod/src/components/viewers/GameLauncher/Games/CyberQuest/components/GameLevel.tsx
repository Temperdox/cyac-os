import React, { useState, useEffect, useRef } from 'react';
import styles from './GameLevel.module.css';
import { Level, PlayerData, Objective, MiniGame, GameConfig } from '../types';
import MiniGameComponent from './MiniGameComponent';
import Timer from './Timer';

interface GameLevelProps {
    level: Level;
    playerData: PlayerData;
    gameConfig: GameConfig;
    onComplete: (levelId: string, score: number, perfect: boolean) => void;
    onReset: () => void;
}

const GameLevel: React.FC<GameLevelProps> = ({
                                                 level,
                                                 playerData,
                                                 gameConfig,
                                                 onComplete,
                                                 onReset
                                             }) => {
    // Level state
    const [currentObjectives, setCurrentObjectives] = useState<Objective[]>([]);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [gameCompleted, setGameCompleted] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);
    const [currentMiniGame, setCurrentMiniGame] = useState<MiniGame | null>(null);
    const [showIntro, setShowIntro] = useState<boolean>(true);
    const [showOutro, setShowOutro] = useState<boolean>(false);
    const [remainingTime, setRemainingTime] = useState<number>(level.timeLimit || 0);
    const [isPaused, setIsPaused] = useState<boolean>(true);

    // Refs
    const levelContentRef = useRef<HTMLDivElement>(null);

    // Initialize level
    useEffect(() => {
        // Clone objectives to avoid modifying original data
        setCurrentObjectives(level.data.objectives.map(obj => ({
            ...obj,
            completed: false
        })));

        // Reset state
        setGameStarted(false);
        setGameCompleted(false);
        setScore(0);
        setShowIntro(true);
        setShowOutro(false);
        setCurrentMiniGame(null);
        setRemainingTime(level.timeLimit || 0);
        setIsPaused(true);

        // Use gameConfig for difficulty settings or other configurations
        // Example: Setting up enemy difficulty based on gameConfig
        const difficultyMultiplier = gameConfig.settings.pointsMultiplier;
        console.log(`Level difficulty modifier: ${difficultyMultiplier}`);
    }, [level, gameConfig]);

    // Update remaining time
    useEffect(() => {
        if (!gameStarted || gameCompleted || isPaused || !level.timeLimit) return;

        const timer = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameStarted, gameCompleted, isPaused, level.timeLimit]);

    // Check if all objectives are completed
    useEffect(() => {
        if (!gameStarted || gameCompleted) return;

        const allCompleted = currentObjectives.every(obj => obj.completed);

        if (allCompleted) {
            handleLevelComplete();
        }
    }, [currentObjectives, gameStarted, gameCompleted]);

    // Start the level
    const startLevel = () => {
        setShowIntro(false);
        setGameStarted(true);
        setIsPaused(false);
    };

    // Handle time up
    const handleTimeUp = () => {
        setIsPaused(true);
        // Calculate score based on completed objectives
        const calculatedScore = currentObjectives
            .filter(obj => obj.completed)
            .reduce((total, obj) => total + obj.points, 0);

        console.log(`Time expired. Final score: ${calculatedScore}`);

        // Player loses the level if time runs out
        onReset();
    };

    // Handle level completion
    const handleLevelComplete = () => {
        setGameCompleted(true);
        setIsPaused(true);

        // Calculate final score
        const objectivesScore = currentObjectives.reduce((total, obj) => {
            return obj.completed ? total + obj.points : total;
        }, 0);

        // Time bonus - more points for completing faster
        let timeBonus = 0;
        if (level.timeLimit) {
            const timePercentRemaining = remainingTime / level.timeLimit;
            timeBonus = Math.floor(level.rewards.bonusPoints * timePercentRemaining);
        }

        const finalScore = objectivesScore + timeBonus;
        const isPerfect = finalScore >= level.maxScore;

        // Show outro message
        if (level.data.outro) {
            setShowOutro(true);

            // After showing outro, complete the level
            setTimeout(() => {
                onComplete(level.id, finalScore, isPerfect);
            }, 3000);
        } else {
            // Complete the level immediately if no outro
            onComplete(level.id, finalScore, isPerfect);
        }
    };

    // Handle objective completion
    const completeObjective = (objectiveId: string) => {
        setCurrentObjectives(prev =>
            prev.map(obj =>
                obj.id === objectiveId ? { ...obj, completed: true } : obj
            )
        );

        // Find the completed objective to add score
        const objective = currentObjectives.find(obj => obj.id === objectiveId);
        if (objective && !objective.completed) {
            setScore(prev => prev + objective.points);
        }
    };

    // Start a mini-game
    const startMiniGame = (miniGameId: string) => {
        const miniGame = level.miniGames?.find(game => game.id === miniGameId);
        if (miniGame) {
            setCurrentMiniGame(miniGame);
            setIsPaused(true);
        }
    };

    // Handle mini-game completion
    const handleMiniGameComplete = (result: { success: boolean; score: number }) => {
        setCurrentMiniGame(null);
        setIsPaused(false);

        if (result.success) {
            // Add points from mini-game
            setScore(prev => prev + result.score);

            // Check if this mini-game completion should trigger an objective
            const relatedObjective = currentObjectives.find(
                obj => obj.type === 'solve' && obj.target === currentMiniGame?.id
            );

            if (relatedObjective && !relatedObjective.completed) {
                completeObjective(relatedObjective.id);
            }
        }
    };

    // Render the mini-game component
    const renderMiniGame = () => {
        if (!currentMiniGame) return null;

        return (
            <div className={styles.miniGameOverlay}>
                <MiniGameComponent
                    miniGame={currentMiniGame}
                    playerData={playerData}
                    onComplete={handleMiniGameComplete}
                    onCancel={() => {
                        setCurrentMiniGame(null);
                        setIsPaused(false);
                    }}
                />
            </div>
        );
    };

    // Handle interaction with elements in the level
    const handleInteraction = (elementId: string, action: string) => {
        // Find objective that matches this interaction
        const matchingObjective = currentObjectives.find(obj => {
            return (
                !obj.completed &&
                String(obj.target) === elementId &&
                (
                    (obj.type === 'activate' && action === 'activate') ||
                    (obj.type === 'hack' && action === 'hack') ||
                    (obj.type === 'collect' && action === 'collect') ||
                    (obj.type === 'reach' && action === 'reach')
                )
            );
        });

        if (matchingObjective) {
            completeObjective(matchingObjective.id);
        }

        // Check if this interaction should start a mini-game
        if (action === 'solve' && level.miniGames) {
            const miniGame = level.miniGames.find(game => game.id === elementId);
            if (miniGame) {
                startMiniGame(miniGame.id);
            }
        }
    };

    // Render the level content
    const renderLevelContent = () => {
        // This would be a dynamic rendering based on level.type
        // For this example, we'll just render a simple grid
        switch (level.type) {
            case 'puzzle':
                return renderPuzzleLevel();
            case 'hacking':
                return renderHackingLevel();
            case 'maze':
                return renderMazeLevel();
            case 'stealth':
                return renderStealthLevel();
            case 'decryption':
                return renderDecryptionLevel();
            default:
                return (
                    <div className={styles.defaultLevel}>
                        <p>Level type not implemented: {level.type}</p>
                    </div>
                );
        }
    };

    // For simplicity, we'll create placeholder renderers for level types
    // In a real implementation, these would be more complex

    const renderPuzzleLevel = () => {
        return (
            <div className={styles.puzzleLevel}>
                <div className={styles.puzzleGrid}>
                    {level.data.objectives.map((objective, index) => (
                        <div
                            key={objective.id}
                            className={`${styles.puzzleElement} ${currentObjectives[index]?.completed ? styles.completed : ''}`}
                            onClick={() => !currentObjectives[index]?.completed && handleInteraction(String(objective.target), objective.type)}
                        >
                            <div className={styles.objectiveIcon}>
                                {getObjectiveIcon(objective.type)}
                            </div>
                            <div className={styles.objectiveDescription}>
                                {objective.description}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderHackingLevel = () => {
        return (
            <div className={styles.hackingLevel}>
                <div className={styles.hackingTerminal}>
                    <div className={styles.terminalHeader}>
                        <div className={styles.terminalTitle}>SYSTEM ACCESS</div>
                        <div className={styles.terminalStatus}>CONNECTED</div>
                    </div>
                    <div className={styles.terminalContent}>
                        {level.data.objectives.map((objective, index) => (
                            <div
                                key={objective.id}
                                className={`${styles.terminalCommand} ${currentObjectives[index]?.completed ? styles.completedCommand : ''}`}
                                onClick={() => !currentObjectives[index]?.completed && handleInteraction(String(objective.target), objective.type)}
                            >
                                <span className={styles.commandPrefix}>{'>'}</span>
                                <span className={styles.commandText}>{objective.description}</span>
                                {currentObjectives[index]?.completed && (
                                    <span className={styles.commandSuccess}>SUCCESS</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderMazeLevel = () => {
        // For a real implementation, this would read from level.data.gridSize and level.data.entityData
        const gridSize = level.data.gridSize || { width: 5, height: 5 };

        return (
            <div className={styles.mazeLevel}>
                <div
                    className={styles.mazeGrid}
                    style={{
                        gridTemplateColumns: `repeat(${gridSize.width}, 1fr)`,
                        gridTemplateRows: `repeat(${gridSize.height}, 1fr)`
                    }}
                >
                    {Array.from({ length: gridSize.width * gridSize.height }).map((_, index) => {
                        const x = index % gridSize.width;
                        const y = Math.floor(index / gridSize.width);
                        const entity = level.data.entityData?.find(e => e.position.x === x && e.position.y === y);

                        return (
                            <div
                                key={index}
                                className={`${styles.mazeCell} ${entity ? styles[`entity-${entity.type}`] : ''}`}
                                onClick={() => entity && handleInteraction(entity.id, 'reach')}
                            >
                                {entity && getEntityIcon(entity.type)}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderStealthLevel = () => {
        return (
            <div className={styles.stealthLevel}>
                <div className={styles.securityOverlay}>
                    {level.data.entityData?.filter(entity => entity.type === 'camera' || entity.type === 'guard').map(entity => (
                        <div
                            key={entity.id}
                            className={`${styles.securityEntity} ${styles[entity.type]}`}
                            style={{
                                left: `${(entity.position.x / 10) * 100}%`,
                                top: `${(entity.position.y / 10) * 100}%`
                            }}
                        >
                            {entity.type === 'camera' ? '📹' : '👮'}
                        </div>
                    ))}
                </div>

                <div className={styles.interactionPoints}>
                    {level.data.objectives.map((objective, index) => (
                        <div
                            key={objective.id}
                            className={`${styles.interactionPoint} ${currentObjectives[index]?.completed ? styles.completed : ''}`}
                            onClick={() => !currentObjectives[index]?.completed && handleInteraction(String(objective.target), objective.type)}
                        >
                            {getObjectiveIcon(objective.type)}
                            <div className={styles.interactionTooltip}>
                                {objective.description}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderDecryptionLevel = () => {
        return (
            <div className={styles.decryptionLevel}>
                <div className={styles.decryptionConsole}>
                    <div className={styles.consoleOutput}>
                        <div className={styles.consoleLines}>
                            <div className={styles.consoleLine}>INITIALIZING DECRYPTION MODULE...</div>
                            <div className={styles.consoleLine}>SCANNING FOR ENCRYPTED DATA...</div>
                            <div className={styles.consoleLine}>TARGET IDENTIFIED: {level.name}</div>
                            <div className={styles.consoleLine}>SECURITY LEVEL: {level.difficulty.toUpperCase()}</div>
                            <div className={styles.consoleLine}>WAITING FOR USER INPUT...</div>
                        </div>
                    </div>

                    <div className={styles.consoleInput}>
                        {level.data.objectives.map((objective, index) => (
                            <div
                                key={objective.id}
                                className={`${styles.decryptionTask} ${currentObjectives[index]?.completed ? styles.decrypted : ''}`}
                                onClick={() => !currentObjectives[index]?.completed && handleInteraction(String(objective.target), objective.type)}
                            >
                                <div className={styles.taskHeader}>
                                    <div className={styles.taskType}>{objective.type.toUpperCase()}</div>
                                    <div className={styles.taskStatus}>
                                        {currentObjectives[index]?.completed ? 'DECRYPTED' : 'ENCRYPTED'}
                                    </div>
                                </div>
                                <div className={styles.taskDescription}>{objective.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // Helper function to get icon for objective type
    const getObjectiveIcon = (type: string): string => {
        switch (type) {
            case 'collect': return '📦';
            case 'activate': return '🔘';
            case 'hack': return '💻';
            case 'reach': return '🚩';
            case 'solve': return '🧩';
            case 'defeat': return '⚔️';
            case 'protect': return '🛡️';
            case 'find': return '🔍';
            default: return '❓';
        }
    };

    // Helper function to get icon for entity type
    const getEntityIcon = (type: string): string => {
        switch (type) {
            case 'player': return '👤';
            case 'server': return '🖥️';
            case 'firewall': return '🔥';
            case 'camera': return '📹';
            case 'guard': return '👮';
            case 'terminal': return '💻';
            case 'data': return '💾';
            default: return '❓';
        }
    };

    return (
        <div className={styles.gameLevel}>
            {/* Level header with info */}
            <div className={styles.levelHeader}>
                <h2 className={styles.levelName}>{level.name}</h2>
                <div className={styles.levelStats}>
                    <div className={styles.levelType}>{level.type.toUpperCase()}</div>
                    <div className={styles.levelDifficulty}>{level.difficulty.toUpperCase()}</div>
                </div>

                {level.timeLimit && (
                    <Timer
                        time={remainingTime}
                        totalTime={level.timeLimit}
                        isPaused={isPaused}
                    />
                )}

                <div className={styles.score}>
                    SCORE: {score}
                </div>

                <button className={styles.resetButton} onClick={onReset}>
                    RESET
                </button>
            </div>

            {/* Objectives sidebar */}
            <div className={styles.objectivesSidebar}>
                <h3 className={styles.objectivesTitle}>OBJECTIVES</h3>
                <div className={styles.objectivesList}>
                    {currentObjectives.map(objective => (
                        <div
                            key={objective.id}
                            className={`${styles.objective} ${objective.completed ? styles.completed : ''}`}
                        >
                            <div className={styles.objectiveCheckbox}>
                                {objective.completed ? '✓' : ''}
                            </div>
                            <div className={styles.objectiveText}>
                                {objective.description}
                            </div>
                            <div className={styles.objectivePoints}>
                                {objective.points} pts
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main level content */}
            <div ref={levelContentRef} className={styles.levelContent}>
                {/* Intro overlay */}
                {showIntro && (
                    <div className={styles.introOverlay}>
                        <div className={styles.introContent}>
                            <h2 className={styles.introTitle}>{level.name}</h2>
                            <p className={styles.introText}>{level.data.intro}</p>
                            <button className={styles.startButton} onClick={startLevel}>
                                START MISSION
                            </button>
                        </div>
                    </div>
                )}

                {/* Level content based on type */}
                {gameStarted && renderLevelContent()}

                {/* Outro overlay */}
                {showOutro && (
                    <div className={styles.outroOverlay}>
                        <div className={styles.outroContent}>
                            <h2 className={styles.outroTitle}>Mission Complete</h2>
                            <p className={styles.outroText}>{level.data.outro}</p>
                            <div className={styles.outroScore}>
                                Final Score: {score}/{level.maxScore}
                            </div>
                        </div>
                    </div>
                )}

                {/* Mini-game overlay */}
                {currentMiniGame && renderMiniGame()}
            </div>
        </div>
    );
};

export default GameLevel;