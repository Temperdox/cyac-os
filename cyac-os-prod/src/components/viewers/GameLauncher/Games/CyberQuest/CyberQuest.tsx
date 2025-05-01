import React, { useState, useEffect } from 'react';
import styles from './CyberQuest.module.css';
import { PointsService } from '../../../../../services/PointsService';
import { AchievementService } from '../../../../../services/AchievementService';
import MainMenu from './components/MainMenu';
import LevelSelect from './components/LevelSelect';
import GameLevel from './components/GameLevel';
import Shop from './components/Shop';
import Inventory from './components/Inventory';
import Tutorial from './components/Tutorial';
import LoadingScreen from './components/LoadingScreen';
import LevelCompleteScreen from './components/LevelCompleteScreen';
import { GameState, PlayerData, Level, ShopItem, GameConfig } from './types';
import { loadLevels, loadGameConfig } from './utils/loaders';
import { createDefaultPlayerData } from './utils/playerUtils';
import HUD from './components/HUD';

// Component props type
interface CyberQuestProps {
    onExit?: () => void;
}

// Define game metadata
export const gameMetadata = {
    id: 'cyberquest',
    title: 'CyberQuest',
    description: 'Hack the system, claim the rewards. Navigate through cyber puzzles to earn cR and unlock achievements.',
    coverImage: '/game-covers/cyberquest.png',
    developer: 'CyberAcme',
    releaseDate: '2025',
    collections: ['puzzle', 'strategy'],
    features: ['singleplayer', 'achievements', 'shop']
};

const CyberQuest: React.FC<CyberQuestProps> = ({ onExit }) => {
    // Game state
    const [gameState, setGameState] = useState<GameState>('loading');
    const [levels, setLevels] = useState<Level[]>([]);
    const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
    const [lastEarnedPoints, setLastEarnedPoints] = useState<number>(0);
    const [showTutorial, setShowTutorial] = useState<boolean>(false);

    // Initialize the game
    useEffect(() => {
        const initGame = async () => {
            try {
                // Load game configuration
                const config = await loadGameConfig();
                setGameConfig(config);

                // Load levels
                const levelsData = await loadLevels();
                setLevels(levelsData);

                // Load player data or create new profile
                const savedPlayer = localStorage.getItem('cyberquest_player');
                if (savedPlayer) {
                    setPlayerData(JSON.parse(savedPlayer));
                } else {
                    const newPlayer = createDefaultPlayerData();
                    setPlayerData(newPlayer);
                    localStorage.setItem('cyberquest_player', JSON.stringify(newPlayer));
                    setShowTutorial(true);
                }

                // Register game achievements
                await registerAchievements();

                // Change state to main menu
                setGameState('main_menu');
            } catch (error) {
                console.error('Failed to initialize CyberQuest:', error);
                setGameState('error');
            }
        };

        initGame();
    }, []);

    // Register achievements with the achievement service
    const registerAchievements = async () => {
        try {
            await AchievementService.registerGameAchievements('cyberquest', [
                {
                    id: 'cyberquest_first_hack',
                    title: 'First Hack',
                    description: 'Complete your first level',
                    icon: '/images/achievements/cyberquest/first-hack.png',
                    rarity: 'common',
                    unlocked: false
                },
                {
                    id: 'cyberquest_level5',
                    title: 'Cyber Adept',
                    description: 'Complete 5 levels',
                    icon: '/images/achievements/cyberquest/cyber-adept.png',
                    rarity: 'uncommon',
                    unlocked: false
                },
                {
                    id: 'cyberquest_level10',
                    title: 'Cyber Master',
                    description: 'Complete 10 levels',
                    icon: '/images/achievements/cyberquest/cyber-master.png',
                    rarity: 'rare',
                    unlocked: false
                },
                {
                    id: 'cyberquest_perfect',
                    title: 'Perfect Execution',
                    description: 'Complete a level with a perfect score',
                    icon: '/images/achievements/cyberquest/perfect.png',
                    rarity: 'rare',
                    unlocked: false
                },
                {
                    id: 'cyberquest_alllevels',
                    title: 'System Domination',
                    description: 'Complete all levels',
                    icon: '/images/achievements/cyberquest/domination.png',
                    rarity: 'epic',
                    unlocked: false
                }
            ]);
        } catch (error) {
            console.error('Failed to register achievements:', error);
        }
    };

    // Save player data to localStorage
    const savePlayerData = (data: PlayerData) => {
        localStorage.setItem('cyberquest_player', JSON.stringify(data));
        setPlayerData(data);
    };

    // Handle level selection
    const handleSelectLevel = (level: Level) => {
        setCurrentLevel(level);
        setGameState('playing');
    };

    // Handle level completion
    const handleLevelComplete = async (levelId: string, score: number, perfect: boolean) => {
        if (!playerData) return;

        // Calculate rewards
        const level = levels.find(l => l.id === levelId);
        if (!level) return;

        // Base points from level
        const basePoints = level.rewards.points;

        // Bonus points based on score percentage
        const scorePercent = score / level.maxScore;
        const bonusPoints = Math.floor(level.rewards.bonusPoints * scorePercent);

        // Total points earned
        const pointsEarned = basePoints + bonusPoints;
        setLastEarnedPoints(pointsEarned);

        // Update player data
        const updatedPlayerData = { ...playerData };

        // Mark level as completed if not already
        const levelIndex = updatedPlayerData.completedLevels.findIndex(cl => cl.id === levelId);
        if (levelIndex === -1) {
            updatedPlayerData.completedLevels.push({
                id: levelId,
                score,
                perfect,
                timestamp: new Date().toISOString()
            });
        } else if (score > updatedPlayerData.completedLevels[levelIndex].score) {
            // Update only if new score is higher
            updatedPlayerData.completedLevels[levelIndex].score = score;
            updatedPlayerData.completedLevels[levelIndex].perfect = perfect;
            updatedPlayerData.completedLevels[levelIndex].timestamp = new Date().toISOString();
        }

        // Add points to player data
        updatedPlayerData.points += pointsEarned;

        // Add points to PointsService
        try {
            await PointsService.addPoints(
                pointsEarned,
                'cyberquest',
                `Completed level: ${level.name}`
            );
        } catch (error) {
            console.error('Failed to add points:', error);
        }

        // Check for achievements
        checkAchievements(updatedPlayerData, perfect);

        // Save updated player data
        savePlayerData(updatedPlayerData);

        // Show level complete screen
        setGameState('level_complete');
    };

    // Check and unlock achievements
    const checkAchievements = async (data: PlayerData, perfectLevel: boolean) => {
        try {
            // First level completed
            if (data.completedLevels.length === 1) {
                await AchievementService.unlockAchievement('cyberquest_first_hack');
            }

            // 5 levels completed
            if (data.completedLevels.length >= 5) {
                await AchievementService.unlockAchievement('cyberquest_level5');
            }

            // 10 levels completed
            if (data.completedLevels.length >= 10) {
                await AchievementService.unlockAchievement('cyberquest_level10');
            }

            // Perfect level
            if (perfectLevel) {
                await AchievementService.unlockAchievement('cyberquest_perfect');
            }

            // All levels completed
            if (data.completedLevels.length === levels.length) {
                await AchievementService.unlockAchievement('cyberquest_alllevels');
            }
        } catch (error) {
            console.error('Failed to process achievements:', error);
        }
    };

    // Continue after level completion
    const handleContinue = () => {
        setGameState('level_select');
    };

    // Reset current level
    const handleResetLevel = () => {
        setGameState('playing');
    };

    // Return to level select
    const handleReturnToLevelSelect = () => {
        setCurrentLevel(null);
        setGameState('level_select');
    };

    // Purchase item from shop
    const handlePurchaseItem = async (item: ShopItem) => {
        if (!playerData) return false;

        // Check if player has enough points
        if (playerData.points < item.price) {
            return false;
        }

        // Update player data
        const updatedPlayerData = { ...playerData };

        // Deduct points
        updatedPlayerData.points -= item.price;

        // Add item to inventory if not already owned
        if (!updatedPlayerData.inventory.some(i => i.id === item.id)) {
            updatedPlayerData.inventory.push({
                id: item.id,
                name: item.name,
                type: item.type,
                description: item.description,
                rarity: item.rarity,
                effects: item.effects,
                acquired: new Date().toISOString()
            });
        }

        // Save updated player data
        savePlayerData(updatedPlayerData);

        // Deduct points from PointsService
        try {
            await PointsService.spendPoints(
                item.price,
                'cyberquest',
                `Purchased item: ${item.name}`
            );
            return true;
        } catch (error) {
            console.error('Failed to deduct points:', error);
            return false;
        }
    };

    // Render different screens based on game state
    const renderGameContent = () => {
        if (!playerData || !gameConfig) {
            return <LoadingScreen />;
        }

        switch (gameState) {
            case 'loading':
                return <LoadingScreen />;

            case 'main_menu':
                return (
                    <MainMenu
                        onPlay={() => setGameState('level_select')}
                        onShop={() => setGameState('shop')}
                        onInventory={() => setGameState('inventory')}
                        onTutorial={() => setGameState('tutorial')}
                        onExit={onExit}
                        playerData={playerData}
                        gameMetadata={gameMetadata}
                    />
                );

            case 'level_select':
                return (
                    <LevelSelect
                        levels={levels}
                        playerData={playerData}
                        onSelectLevel={handleSelectLevel}
                        onBack={() => setGameState('main_menu')}
                    />
                );

            case 'playing':
                return currentLevel ? (
                    <>
                        <HUD
                            playerData={playerData}
                            level={currentLevel}
                            onBack={handleReturnToLevelSelect}
                        />
                        <GameLevel
                            level={currentLevel}
                            playerData={playerData}
                            onComplete={handleLevelComplete}
                            onReset={handleResetLevel}
                            gameConfig={gameConfig}
                        />
                    </>
                ) : (
                    <div className={styles.errorScreen}>Level data not found</div>
                );

            case 'level_complete':
                return (
                    <LevelCompleteScreen
                        level={currentLevel}
                        pointsEarned={lastEarnedPoints}
                        onContinue={handleContinue}
                        onRetry={handleResetLevel}
                    />
                );

            case 'shop':
                return (
                    <Shop
                        items={gameConfig.shopItems}
                        playerData={playerData}
                        onPurchase={handlePurchaseItem}
                        onBack={() => setGameState('main_menu')}
                    />
                );

            case 'inventory':
                return (
                    <Inventory
                        playerData={playerData}
                        onBack={() => setGameState('main_menu')}
                    />
                );

            case 'tutorial':
                return (
                    <Tutorial
                        onComplete={() => setGameState('main_menu')}
                    />
                );

            case 'error':
            default:
                return (
                    <div className={styles.errorScreen}>
                        <h2>Error</h2>
                        <p>Something went wrong. Please try again later.</p>
                        <button onClick={() => setGameState('main_menu')}>Return to Menu</button>
                    </div>
                );
        }
    };

    return (
        <div className={styles.cyberQuest}>
            {renderGameContent()}
            {showTutorial && gameState === 'main_menu' && (
                <Tutorial
                    onComplete={() => setShowTutorial(false)}
                />
            )}
        </div>
    );
};

export default CyberQuest;