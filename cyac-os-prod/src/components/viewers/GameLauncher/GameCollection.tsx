import React, { useRef, useState } from 'react';
import styles from './GameCollection.module.css';
import { Game, Collection } from './types';
import GameCard from './GameCard';

interface GameCollectionProps {
    collection: Collection;
    games: Game[];
    onGameLaunch: (game: Game) => void;
}

const GameCollection: React.FC<GameCollectionProps> = ({
                                                           collection,
                                                           games,
                                                           onGameLaunch
                                                       }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    // Handle scroll position to determine arrow visibility
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

        // Show left arrow if we've scrolled to the right
        setShowLeftArrow(scrollLeft > 0);

        // Show right arrow if there's more content to scroll to
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    // Scroll left or right
    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
        const scrollAmount = container.clientWidth * 0.75; // Scroll 75% of the container width

        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    // If there are no games, don't render anything
    if (games.length === 0) return null;

    return (
        <div className={styles.collection}>
            <div className={styles.header}>
                <h2 className={styles.title}>{collection.name}</h2>
                <p className={styles.description}>{collection.description}</p>
            </div>

            <div className={styles.carouselContainer}>
                {showLeftArrow && (
                    <button
                        className={`${styles.scrollButton} ${styles.scrollLeft}`}
                        onClick={() => scroll('left')}
                    >
                        ◄
                    </button>
                )}

                <div
                    className={styles.gameList}
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                >
                    {games.map(game => (
                        <div key={game.id} className={styles.gameCardWrapper}>
                            <GameCard
                                game={game}
                                onLaunch={() => onGameLaunch(game)}
                            />
                        </div>
                    ))}
                </div>

                {showRightArrow && (
                    <button
                        className={`${styles.scrollButton} ${styles.scrollRight}`}
                        onClick={() => scroll('right')}
                    >
                        ►
                    </button>
                )}
            </div>
        </div>
    );
};

export default GameCollection;