import React, { useState } from 'react';
import styles from './GameCard.module.css';
import { Game } from './types';

interface GameCardProps {
    game: Game;
    onLaunch: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onLaunch }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={styles.gameCard}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onLaunch}
        >
            <div
                className={styles.cover}
                style={{ backgroundImage: `url(${game.coverImage})` }}
            />

            <div className={styles.info}>
                <h3 className={styles.title}>{game.title}</h3>
                <div className={styles.meta}>
                    <span className={styles.developer}>{game.developer}</span>
                    <span className={styles.date}>{game.releaseDate}</span>
                </div>
            </div>

            {isHovered && (
                <div className={styles.overlay}>
                    <p className={styles.description}>{game.description}</p>
                    <button className={styles.playButton}>PLAY</button>
                </div>
            )}
        </div>
    );
};

export default GameCard;