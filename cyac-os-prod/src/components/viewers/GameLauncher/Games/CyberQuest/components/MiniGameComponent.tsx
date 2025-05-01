import React, { useState, useEffect } from 'react';
import styles from './MiniGameComponent.module.css';
import { MiniGame, PlayerData } from '../types';
import PasswordCrackGame from './mini-games/PasswordCrackGame';
/*import WireConnectGame from './mini-games/WireConnectGame';
import PatternMatchGame from './mini-games/PatternMatchGame';
import MemoryGame from './mini-games/MemoryGame';
import TimingGame from './mini-games/TimingGame';
import LockpickGame from './mini-games/LockpickGame';*/

interface MiniGameComponentProps {
    miniGame: MiniGame;
    playerData: PlayerData;
    onComplete: (result: { success: boolean; score: number }) => void;
    onCancel: () => void;
}

const MiniGameComponent: React.FC<MiniGameComponentProps> = ({
                                                                 miniGame,
                                                                 playerData,
                                                                 onComplete,
                                                                 onCancel
                                                             }) => {
    const [timeLeft, setTimeLeft] = useState<number>(30); // Default 30 seconds
    const [isPaused, _setIsPaused] = useState<boolean>(false);

    // Start timer
    useEffect(() => {
        if (isPaused) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Time's up - fail the mini-game
                    onComplete({ success: false, score: 0 });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPaused, onComplete]);

    // Handle mini-game completion
    const handleGameComplete = (success: boolean, score: number) => {
        onComplete({ success, score });
    };

    // Render the appropriate mini-game based on type
    const renderMiniGame = () => {
        switch (miniGame.type) {
            case 'password_crack':
                return (
                    <PasswordCrackGame
                        gameData={miniGame.data}
                        onComplete={handleGameComplete}
                        timeLeft={timeLeft}
                        playerData={playerData}
                    />
                );

            /*case 'wire_connect':
                return (
                    <WireConnectGame
                        gameData={miniGame.data}
                        onComplete={handleGameComplete}
                        timeLeft={timeLeft}
                        playerData={playerData}
                    />
                );

            case 'pattern_match':
                return (
                    <PatternMatchGame
                        gameData={miniGame.data}
                        onComplete={handleGameComplete}
                        timeLeft={timeLeft}
                        playerData={playerData}
                    />
                );

            case 'memory':
                return (
                    <MemoryGame
                        gameData={miniGame.data}
                        onComplete={handleGameComplete}
                        timeLeft={timeLeft}
                        playerData={playerData}
                    />
                );

            case 'timing':
                return (
                    <TimingGame
                        gameData={miniGame.data}
                        onComplete={handleGameComplete}
                        timeLeft={timeLeft}
                        playerData={playerData}
                    />
                );

            case 'lockpick':
                return (
                    <LockpickGame
                        gameData={miniGame.data}
                        onComplete={handleGameComplete}
                        timeLeft={timeLeft}
                        playerData={playerData}
                    />
                );*/

            default:
                return (
                    <div className={styles.notImplemented}>
                        <h3>Mini-game not implemented: {miniGame.type}</h3>
                        <button
                            className={styles.completeButton}
                            onClick={() => handleGameComplete(true, miniGame.rewards.points)}
                        >
                            Complete
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className={styles.miniGameContainer}>
            <div className={styles.miniGameHeader}>
                <h3 className={styles.miniGameTitle}>
                    {getMiniGameTitle(miniGame.type)}
                </h3>
                <div className={styles.timer}>
                    Time: <span className={timeLeft < 10 ? styles.timerWarning : ''}>
            {timeLeft}s
          </span>
                </div>
                <button className={styles.cancelButton} onClick={onCancel}>
                    Cancel
                </button>
            </div>

            <div className={styles.miniGameContent}>
                {renderMiniGame()}
            </div>
        </div>
    );
};

// Helper function to get a user-friendly title for mini-game types
const getMiniGameTitle = (type: string): string => {
    switch (type) {
        case 'password_crack':
            return 'Password Cracker';
        case 'wire_connect':
            return 'Circuit Connector';
        case 'pattern_match':
            return 'Pattern Recognition';
        case 'memory':
            return 'Memory Matrix';
        case 'timing':
            return 'Timing Sequence';
        case 'lockpick':
            return 'Security Lockpick';
        default:
            return type.split('_').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
    }
};

export default MiniGameComponent;