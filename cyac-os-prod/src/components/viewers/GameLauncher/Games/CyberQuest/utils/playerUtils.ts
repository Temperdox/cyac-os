import { PlayerData, PlayerSettings, DifficultyLevel } from '../types';

/**
 * Generate a random ID for a new player
 */
const generatePlayerId = (): string => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `player_${timestamp}_${randomStr}`;
};

/**
 * Create default player settings
 */
export const createDefaultSettings = (): PlayerSettings => {
    return {
        soundEnabled: true,
        musicEnabled: true,
        sfxVolume: 0.7,
        musicVolume: 0.5,
        difficulty: 'normal' as DifficultyLevel,
        colorScheme: 'default'
    };
};

/**
 * Create a new player data object
 */
export const createDefaultPlayerData = (): PlayerData => {
    const now = new Date().toISOString();

    return {
        id: generatePlayerId(),
        username: 'Agent',
        points: 0,
        level: 1,
        experience: 0,
        completedLevels: [],
        inventory: [],
        settings: createDefaultSettings(),
        createdAt: now,
        lastLogin: now
    };
};

/**
 * Calculate player level based on experience points
 * @param experience Total experience points
 * @returns Current level
 */
export const calculatePlayerLevel = (experience: number): number => {
    // Simple level calculation formula
    // Each level requires baseXP * level^1.5 experience
    const baseXP = 100;
    let level = 1;
    let xpForNextLevel = baseXP;

    while (experience >= xpForNextLevel) {
        level++;
        xpForNextLevel = Math.floor(baseXP * Math.pow(level, 1.5));
        experience -= xpForNextLevel;
    }

    return level;
};

/**
 * Calculate experience required for next level
 * @param currentLevel Current player level
 * @returns XP required for next level
 */
export const calculateXPForNextLevel = (currentLevel: number): number => {
    const baseXP = 100;
    return Math.floor(baseXP * Math.pow(currentLevel + 1, 1.5));
};

/**
 * Add experience to player and update level if needed
 * @param playerData Current player data
 * @param amount Amount of experience to add
 * @returns Updated player data
 */
export const addExperience = (playerData: PlayerData, amount: number): PlayerData => {
    const updatedPlayerData = { ...playerData };
    updatedPlayerData.experience += amount;

    // Check if player has leveled up
    const newLevel = calculatePlayerLevel(updatedPlayerData.experience);
    if (newLevel > playerData.level) {
        updatedPlayerData.level = newLevel;
    }

    return updatedPlayerData;
};

/**
 * Check if player has completed a level
 * @param playerData Player data
 * @param levelId Level ID to check
 * @returns Whether the level is completed
 */
export const hasCompletedLevel = (playerData: PlayerData, levelId: string): boolean => {
    return playerData.completedLevels.some(level => level.id === levelId);
};

/**
 * Get player's best score for a level
 * @param playerData Player data
 * @param levelId Level ID to check
 * @returns Best score or 0 if level not completed
 */
export const getLevelBestScore = (playerData: PlayerData, levelId: string): number => {
    const completedLevel = playerData.completedLevels.find(level => level.id === levelId);
    return completedLevel ? completedLevel.score : 0;
};

/**
 * Check if player has a specific item in inventory
 * @param playerData Player data
 * @param itemId Item ID to check
 * @returns Whether the player has the item
 */
export const hasItem = (playerData: PlayerData, itemId: string): boolean => {
    return playerData.inventory.some(item => item.id === itemId);
};

/**
 * Update player settings
 * @param playerData Current player data
 * @param settings New settings to apply
 * @returns Updated player data
 */
export const updateSettings = (
    playerData: PlayerData,
    settings: Partial<PlayerSettings>
): PlayerData => {
    return {
        ...playerData,
        settings: {
            ...playerData.settings,
            ...settings
        }
    };
};

/**
 * Reset player progress (for testing)
 * @returns Fresh player data
 */
export const resetPlayerProgress = (): PlayerData => {
    return createDefaultPlayerData();
};