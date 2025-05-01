/**
 * Service for managing user achievements
 */

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    game: string;
    unlocked: boolean;
    unlockedAt?: Date;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export class AchievementService {
    // Local storage key for achievements data
    private static readonly STORAGE_KEY = 'cyac_user_achievements';

    // Cached achievements to prevent frequent localStorage access
    private static cachedAchievements: Achievement[] | null = null;

    /**
     * Get all achievements for the current user
     * @returns Promise<Achievement[]> List of user achievements
     */
    public static async getUserAchievements(): Promise<Achievement[]> {
        // If we have a cached version, return it
        if (this.cachedAchievements) {
            return this.cachedAchievements;
        }

        // Mock delay for simulating API call
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            // Try to get from localStorage
            const achievementsData = localStorage.getItem(this.STORAGE_KEY);

            if (achievementsData) {
                // Parse stored data
                const achievements = JSON.parse(achievementsData) as Achievement[];

                // Convert string dates to Date objects
                achievements.forEach(achievement => {
                    if (achievement.unlockedAt) {
                        achievement.unlockedAt = new Date(achievement.unlockedAt);
                    }
                });

                // Cache the result
                this.cachedAchievements = achievements;
                return achievements;
            }

            // If no data exists, generate demo achievements
            const demoAchievements = this.generateDemoAchievements();

            // Cache and store the demo data
            this.cachedAchievements = demoAchievements;
            this.saveAchievements(demoAchievements);

            return demoAchievements;
        } catch (error) {
            console.error('Error getting user achievements:', error);
            return [];
        }
    }

    /**
     * Get achievements for a specific game
     * @param gameId The game ID to filter by
     * @returns Promise<Achievement[]> List of achievements for the specified game
     */
    public static async getGameAchievements(gameId: string): Promise<Achievement[]> {
        const allAchievements = await this.getUserAchievements();
        return allAchievements.filter(a => a.game === gameId);
    }

    /**
     * Unlock an achievement for the current user
     * @param achievementId ID of the achievement to unlock
     * @returns Promise<boolean> Success status
     */
    public static async unlockAchievement(achievementId: string): Promise<boolean> {
        try {
            const achievements = await this.getUserAchievements();
            const achievementIndex = achievements.findIndex(a => a.id === achievementId);

            if (achievementIndex === -1) {
                return false;
            }

            // Skip if already unlocked
            if (achievements[achievementIndex].unlocked) {
                return true;
            }

            // Unlock the achievement
            achievements[achievementIndex].unlocked = true;
            achievements[achievementIndex].unlockedAt = new Date();

            // Save changes
            this.saveAchievements(achievements);
            return true;
        } catch (error) {
            console.error('Error unlocking achievement:', error);
            return false;
        }
    }

    /**
     * Reset all achievements for the current user (for testing)
     * @returns Promise<boolean> Success status
     */
    public static async resetAchievements(): Promise<boolean> {
        try {
            const achievements = await this.getUserAchievements();

            // Reset unlock status for all achievements
            achievements.forEach(achievement => {
                achievement.unlocked = false;
                delete achievement.unlockedAt;
            });

            // Save changes
            this.saveAchievements(achievements);
            return true;
        } catch (error) {
            console.error('Error resetting achievements:', error);
            return false;
        }
    }

    /**
     * Register new achievements from a game
     * This allows games to add their achievements to the user's profile
     * @param gameId The game ID
     * @param achievements Array of achievements to register
     * @returns Promise<boolean> Success status
     */
    public static async registerGameAchievements(
        gameId: string,
        achievements: Omit<Achievement, 'game'>[]
    ): Promise<boolean> {
        try {
            const currentAchievements = await this.getUserAchievements();

            // Process each new achievement
            const newAchievements = achievements.map(achievement => ({
                ...achievement,
                game: gameId,
                unlocked: false // Start as locked
            }));

            // Check for duplicates and add only new ones
            const existingIds = currentAchievements.map(a => a.id);
            const uniqueNewAchievements = newAchievements.filter(
                a => !existingIds.includes(a.id)
            );

            if (uniqueNewAchievements.length === 0) {
                return true; // Nothing new to add
            }

            // Combine and save
            const combinedAchievements = [...currentAchievements, ...uniqueNewAchievements];
            this.saveAchievements(combinedAchievements);

            return true;
        } catch (error) {
            console.error('Error registering game achievements:', error);
            return false;
        }
    }

    /**
     * Clear the achievements cache to force reload from storage
     */
    public static clearCache(): void {
        this.cachedAchievements = null;
    }

    /**
     * Save achievements to localStorage
     * @param achievements Achievements array to save
     */
    private static saveAchievements(achievements: Achievement[]): void {
        // Update cache
        this.cachedAchievements = achievements;

        // Save to localStorage
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(achievements));
        } catch (error) {
            console.error('Error saving achievements to localStorage:', error);
        }
    }

    /**
     * Generate demo achievements for testing
     * @returns Achievement[] Array of demo achievements
     */
    private static generateDemoAchievements(): Achievement[] {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);

        // Create a variety of achievements across different games
        return [
            {
                id: 'cyberquest_complete',
                title: 'Code Master',
                description: 'Complete all hacking challenges in CyberQuest',
                icon: '/images/achievements/code-master.png',
                game: 'cyberquest',
                rarity: 'epic',
                unlocked: true,
                unlockedAt: monthAgo
            },
            {
                id: 'cyberquest_firsthack',
                title: 'First Hack',
                description: 'Complete your first hacking challenge',
                icon: '/images/achievements/first-hack.png',
                game: 'cyberquest',
                rarity: 'common',
                unlocked: true,
                unlockedAt: monthAgo
            },
            {
                id: 'cyberquest_speedrun',
                title: 'Speed Hacker',
                description: 'Complete all level 1 challenges in under 5 minutes',
                icon: '/images/achievements/speed-hacker.png',
                game: 'cyberquest',
                rarity: 'rare',
                unlocked: false
            },
            {
                id: 'spaceshooter_highscore',
                title: 'Space Ace',
                description: 'Score over 10,000 points in Space Shooter',
                icon: '/images/achievements/space-ace.png',
                game: 'space_shooter',
                rarity: 'uncommon',
                unlocked: true,
                unlockedAt: weekAgo
            },
            {
                id: 'spaceshooter_nohit',
                title: 'Untouchable',
                description: 'Complete a level without taking damage',
                icon: '/images/achievements/untouchable.png',
                game: 'space_shooter',
                rarity: 'rare',
                unlocked: true,
                unlockedAt: dayAgo
            },
            {
                id: 'spaceshooter_allships',
                title: 'Fleet Commander',
                description: 'Unlock all ships in Space Shooter',
                icon: '/images/achievements/fleet-commander.png',
                game: 'space_shooter',
                rarity: 'epic',
                unlocked: false
            },
            {
                id: 'spaceshooter_legendary',
                title: 'Galactic Legend',
                description: 'Complete all levels on Insane difficulty',
                icon: '/images/achievements/galactic-legend.png',
                game: 'space_shooter',
                rarity: 'legendary',
                unlocked: false
            },
            {
                id: 'retropuzzle_complete',
                title: 'Puzzle Master',
                description: 'Complete all puzzles in Retro Puzzle',
                icon: '/images/achievements/puzzle-master.png',
                game: 'retro_puzzle',
                rarity: 'rare',
                unlocked: false
            },
            {
                id: 'retropuzzle_first',
                title: 'First Steps',
                description: 'Complete your first puzzle',
                icon: '/images/achievements/first-steps.png',
                game: 'retro_puzzle',
                rarity: 'common',
                unlocked: true,
                unlockedAt: weekAgo
            },
            {
                id: 'system_login',
                title: 'Welcome Aboard',
                description: 'Log in to the system for the first time',
                icon: '/images/achievements/welcome.png',
                game: 'system',
                rarity: 'common',
                unlocked: true,
                unlockedAt: monthAgo
            },
            {
                id: 'system_customize',
                title: 'Personal Touch',
                description: 'Customize your profile',
                icon: '/images/achievements/personal-touch.png',
                game: 'system',
                rarity: 'uncommon',
                unlocked: false
            },
            {
                id: 'system_explorer',
                title: 'System Explorer',
                description: 'Visit all sections of the system',
                icon: '/images/achievements/explorer.png',
                game: 'system',
                rarity: 'uncommon',
                unlocked: false
            }
        ];
    }
}

export default AchievementService;