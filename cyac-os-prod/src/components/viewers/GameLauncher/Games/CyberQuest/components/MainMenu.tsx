import React, { useState, useEffect } from 'react';
import styles from './MainMenu.module.css';
import { PlayerData } from '../types';

interface MainMenuProps {
    onPlay: () => void;
    onShop: () => void;
    onInventory: () => void;
    onTutorial: () => void;
    onExit?: () => void;
    playerData: PlayerData;
    gameMetadata: any;
}

const MainMenu: React.FC<MainMenuProps> = ({
                                               onPlay,
                                               onShop,
                                               onInventory,
                                               onTutorial,
                                               onExit,
                                               playerData,
                                               gameMetadata
                                           }) => {
    const [animatedTitle, setAnimatedTitle] = useState<string>('');
    const [titleComplete, setTitleComplete] = useState<boolean>(false);
    const [showButtons, setShowButtons] = useState<boolean>(false);

    // Animate title on component mount
    useEffect(() => {
        const title = gameMetadata.title;
        let currentIndex = 0;

        const titleInterval = setInterval(() => {
            if (currentIndex <= title.length) {
                setAnimatedTitle(title.substring(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(titleInterval);
                setTitleComplete(true);

                // Show buttons after title animation
                setTimeout(() => {
                    setShowButtons(true);
                }, 300);
            }
        }, 100);

        return () => clearInterval(titleInterval);
    }, [gameMetadata.title]);

    return (
        <div className={styles.mainMenu}>
            <div className={styles.background}>
                <div className={styles.grid}></div>
                <div className={styles.scanlines}></div>
            </div>

            <div className={styles.content}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.title}>
                        {animatedTitle}
                        {!titleComplete && <span className={styles.cursor}>|</span>}
                    </h1>
                    {titleComplete && <p className={styles.subtitle}>{gameMetadata.description}</p>}
                </div>

                {showButtons && (
                    <div className={styles.menuButtons}>
                        <button className={styles.menuButton} onClick={onPlay}>
                            <span className={styles.buttonIcon}>▶</span>
                            <span className={styles.buttonText}>PLAY</span>
                        </button>

                        <button className={styles.menuButton} onClick={onShop}>
                            <span className={styles.buttonIcon}>🛒</span>
                            <span className={styles.buttonText}>SHOP</span>
                        </button>

                        <button className={styles.menuButton} onClick={onInventory}>
                            <span className={styles.buttonIcon}>📦</span>
                            <span className={styles.buttonText}>INVENTORY</span>
                        </button>

                        <button className={styles.menuButton} onClick={onTutorial}>
                            <span className={styles.buttonIcon}>❓</span>
                            <span className={styles.buttonText}>TUTORIAL</span>
                        </button>

                        {onExit && (
                            <button className={styles.menuButton} onClick={onExit}>
                                <span className={styles.buttonIcon}>✕</span>
                                <span className={styles.buttonText}>EXIT</span>
                            </button>
                        )}
                    </div>
                )}

                {showButtons && (
                    <div className={styles.playerInfo}>
                        <div className={styles.playerName}>AGENT: {playerData.username}</div>
                        <div className={styles.playerLevel}>LEVEL: {playerData.level}</div>
                        <div className={styles.playerPoints}>cR: {playerData.points}</div>
                    </div>
                )}

                {showButtons && (
                    <div className={styles.credits}>
                        <div className={styles.version}>v{gameMetadata.releaseDate}</div>
                        <div className={styles.developer}>{gameMetadata.developer}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainMenu;