import React, { useState, useEffect } from 'react';
import styles from './GameLauncher.module.css';
import GameCard from './GameCard';
import GameCollection from './GameCollection';
import { Game, Collection } from './types';
import { loadGameData } from './gameLoader';

interface GameLauncherProps {
    onLaunchGame?: (game: Game) => void;
}

const GameLauncher: React.FC<GameLauncherProps> = ({ onLaunchGame }) => {
    const [games, setGames] = useState<Game[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [featuredGame, setFeaturedGame] = useState<Game | null>(null);

    useEffect(() => {
        // Load game data when component mounts
        const loadGames = async () => {
            try {
                const { games, collections } = await loadGameData();
                setGames(games);
                setCollections(collections);

                // Set a random featured game
                if (games.length > 0) {
                    const randomIndex = Math.floor(Math.random() * games.length);
                    setFeaturedGame(games[randomIndex]);
                }
            } catch (error) {
                console.error('Failed to load games:', error);
            }
        };

        loadGames();
    }, []);

    // Filter games based on search query and selected collection
    const filteredGames = games.filter(game => {
        const matchesSearch = searchQuery === '' ||
            game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            game.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCollection = selectedCollection === null ||
            game.collections.includes(selectedCollection);

        return matchesSearch && matchesCollection;
    });

    // Handle game launch
    const handleGameLaunch = (game: Game) => {
        console.log("Attempting to launch game:", game);
        if (onLaunchGame) {
            console.log("Using onLaunchGame prop");
            onLaunchGame(game);
        } else {
            console.log(`Launching game: ${game.title} with default handler`);
            // Default implementation if no launch handler provided
            // This would be replaced with actual launch logic
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCollection(null);
    };

    return (
        <div className={styles.gameLauncher}>
            <header className={styles.header}>
                <h1 className={styles.title}>CyberAcme Game Center</h1>
                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Search games..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {(searchQuery || selectedCollection) && (
                        <button className={styles.clearButton} onClick={clearFilters}>
                            Clear Filters
                        </button>
                    )}
                </div>
            </header>

            <div className={styles.collectionsBar}>
                <button
                    className={`${styles.collectionButton} ${selectedCollection === null ? styles.active : ''}`}
                    onClick={() => setSelectedCollection(null)}
                >
                    All Games
                </button>
                {collections && collections.length > 0 && collections.map(collection => (
                    <button
                        key={collection.id}
                        className={`${styles.collectionButton} ${selectedCollection === collection.id ? styles.active : ''}`}
                        onClick={() => setSelectedCollection(collection.id)}
                    >
                        {collection.name}
                    </button>
                ))}
            </div>

            {featuredGame && !searchQuery && !selectedCollection && (
                <div className={styles.featuredSection}>
                    <h2 className={styles.sectionTitle}>Featured Game</h2>
                    <div
                        className={styles.featuredGame}
                        style={{backgroundImage: `url(${featuredGame.coverImage})`}}
                        onClick={() => handleGameLaunch(featuredGame)}
                    >
                        <div className={styles.featuredContent}>
                            <h3 className={styles.featuredTitle}>{featuredGame.title}</h3>
                            <p className={styles.featuredDescription}>{featuredGame.description}</p>
                            <button className={styles.playButton}>Play Now</button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.mainContent}>
                {collections.map(collection => {
                    const collectionGames = filteredGames.filter(game =>
                        game.collections.includes(collection.id)
                    );

                    // Only show collections that have games matching current filters
                    if (collectionGames.length === 0) return null;

                    // Don't show collections UI if a specific collection is selected
                    if (selectedCollection !== null) return null;

                    return (
                        <GameCollection
                            key={collection.id}
                            collection={collection}
                            games={collectionGames}
                            onGameLaunch={handleGameLaunch}
                        />
                    );
                })}

                {/* Show a simple grid when a specific collection is selected or searching */}
                {(selectedCollection !== null || searchQuery) && (
                    <div className={styles.gameGrid}>
                        <h2 className={styles.sectionTitle}>
                            {selectedCollection
                                ? collections.find(c => c.id === selectedCollection)?.name || 'Games'
                                : 'Search Results'}
                        </h2>
                        <div className={styles.gameCards}>
                            {filteredGames.length > 0 ? (
                                filteredGames.map(game => (
                                    <GameCard
                                        key={game.id}
                                        game={game}
                                        onLaunch={() => handleGameLaunch(game)}
                                    />
                                ))
                            ) : (
                                <div className={styles.noResults}>
                                    <p>No games found. Try adjusting your search or filters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <footer className={styles.footer}>
                <p>CyberAcme Game Center &copy; 2025</p>
                <p>Total Games: {games.length}</p>
            </footer>
        </div>
    );
};

export default GameLauncher;