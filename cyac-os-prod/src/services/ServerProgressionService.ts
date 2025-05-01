/**
 * Service for managing user server progression and roles
 */

interface UserRole {
    id: string;
    name: string;
    color: string;
    icon?: string;
    priority: number;
}

interface ServerProgression {
    level: number;
    currentXP: number;
    nextLevelXP: number;
    roles: UserRole[];
    milestones: {
        level: number;
        reward: string;
        unlocked: boolean;
    }[];
}

export class ServerProgressionService {
    // Local storage key for progression data
    private static readonly STORAGE_KEY = 'cyac_user_progression';

    // Cached progression to prevent frequent localStorage access
    private static cachedProgression: ServerProgression | null = null;

    /**
     * Get progression data for the current user
     * @returns Promise<ServerProgression> User progression data
     */
    public static async getUserProgression(): Promise<ServerProgression> {
        // If we have a cached version, return it
        if (this.cachedProgression) {
            return this.cachedProgression;
        }

        // Mock delay for simulating API call
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            // Try to get from localStorage
            const progressionData = localStorage.getItem(this.STORAGE_KEY);

            if (progressionData) {
                // Parse stored data
                const progression = JSON.parse(progressionData) as ServerProgression;

                // Cache the result
                this.cachedProgression = progression;
                return progression;
            }

            // If no data exists, generate demo progression
            const demoProgression = this.generateDemoProgression();

            // Cache and store the demo data
            this.cachedProgression = demoProgression;
            this.saveProgression(demoProgression);

            return demoProgression;
        } catch (error) {
            console.error('Error getting user progression:', error);

            // Return default progression
            const defaultProgression = {
                level: 1,
                currentXP: 0,
                nextLevelXP: 100,
                roles: [],
                milestones: []
            };

            return defaultProgression;
        }
    }

    /**
     * Add XP to the user's progression
     * @param amount Amount of XP to add
     * @returns Promise<{newLevel: number, levelUp: boolean}> Information about XP addition
     */
    public static async addXP(amount: number): Promise<{newLevel: number, levelUp: boolean}> {
        try {
            const progression = await this.getUserProgression();

            let currentXP = progression.currentXP + amount;
            let currentLevel = progression.level;
            let levelUp = false;

            // Check for level up
            while (currentXP >= progression.nextLevelXP) {
                currentXP -= progression.nextLevelXP;
                currentLevel++;
                levelUp = true;

                // Update milestones
                progression.milestones.forEach(milestone => {
                    if (milestone.level === currentLevel) {
                        milestone.unlocked = true;
                    }
                });
            }

            // Update progression
            progression.level = currentLevel;
            progression.currentXP = currentXP;

            // Calculate next level XP requirement
            // Using a simple formula: base + (level * multiplier)
            progression.nextLevelXP = 100 + (currentLevel * 50);

            // Save changes
            this.saveProgression(progression);

            return {
                newLevel: currentLevel,
                levelUp
            };
        } catch (error) {
            console.error('Error adding XP:', error);
            return {
                newLevel: 0,
                levelUp: false
            };
        }
    }

    /**
     * Add a role to the user
     * @param role Role to add
     * @returns Promise<boolean> Success status
     */
    public static async addRole(role: UserRole): Promise<boolean> {
        try {
            const progression = await this.getUserProgression();

            // Check if role already exists
            const existingRoleIndex = progression.roles.findIndex(r => r.id === role.id);

            if (existingRoleIndex !== -1) {
                // Update existing role
                progression.roles[existingRoleIndex] = role;
            } else {
                // Add new role
                progression.roles.push(role);
            }

            // Save changes
            this.saveProgression(progression);
            return true;
        } catch (error) {
            console.error('Error adding role:', error);
            return false;
        }
    }

    /**
     * Remove a role from the user
     * @param roleId ID of the role to remove
     * @returns Promise<boolean> Success status
     */
    public static async removeRole(roleId: string): Promise<boolean> {
        try {
            const progression = await this.getUserProgression();

            // Filter out the role
            progression.roles = progression.roles.filter(r => r.id !== roleId);

            // Save changes
            this.saveProgression(progression);
            return true;
        } catch (error) {
            console.error('Error removing role:', error);
            return false;
        }
    }

    /**
     * Add a milestone to the user's progression
     * @param milestone Milestone to add
     * @returns Promise<boolean> Success status
     */
    public static async addMilestone(milestone: {
        level: number;
        reward: string;
        unlocked?: boolean;
    }): Promise<boolean> {
        try {
            const progression = await this.getUserProgression();

            // Set unlocked based on current level
            const unlocked = milestone.unlocked ?? (progression.level >= milestone.level);

            // Add milestone
            progression.milestones.push({
                ...milestone,
                unlocked
            });

            // Sort milestones by level
            progression.milestones.sort((a, b) => a.level - b.level);

            // Save changes
            this.saveProgression(progression);
            return true;
        } catch (error) {
            console.error('Error adding milestone:', error);
            return false;
        }
    }

    /**
     * Set the user's level directly (admin function)
     * @param level New level
     * @returns Promise<boolean> Success status
     */
    public static async setLevel(level: number): Promise<boolean> {
        try {
            if (level < 1) {
                return false;
            }

            const progression = await this.getUserProgression();

            // Update level
            progression.level = level;

            // Update milestones
            progression.milestones.forEach(milestone => {
                milestone.unlocked = milestone.level <= level;
            });

            // Reset XP and calculate next level XP
            progression.currentXP = 0;
            progression.nextLevelXP = 100 + (level * 50);

            // Save changes
            this.saveProgression(progression);
            return true;
        } catch (error) {
            console.error('Error setting level:', error);
            return false;
        }
    }

    /**
     * Clear the progression cache to force reload from storage
     */
    public static clearCache(): void {
        this.cachedProgression = null;
    }

    /**
     * Save progression to localStorage
     * @param progression Progression data to save
     */
    private static saveProgression(progression: ServerProgression): void {
        // Update cache
        this.cachedProgression = progression;

        // Save to localStorage
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progression));
        } catch (error) {
            console.error('Error saving progression to localStorage:', error);
        }
    }

    /**
     * Generate demo progression data for testing
     * @returns ServerProgression Demo progression data
     */
    private static generateDemoProgression(): ServerProgression {
        return {
            level: 4,
            currentXP: 75,
            nextLevelXP: 300, // 100 + (4 * 50)
            roles: [
                {
                    id: 'newcomer',
                    name: 'Newcomer',
                    color: '#3399ff',
                    priority: 1
                },
                {
                    id: 'contributor',
                    name: 'Contributor',
                    color: '#33cc33',
                    icon: '/images/roles/contributor.png',
                    priority: 2
                },
                {
                    id: 'cyber_knight',
                    name: 'Cyber Knight',
                    color: '#cc33ff',
                    icon: '/images/roles/cyber-knight.png',
                    priority: 3
                },
                {
                    id: 'game_dev',
                    name: 'Game Developer',
                    color: '#ffcc33',
                    icon: '/images/roles/game-dev.png',
                    priority: 4
                },
                {
                    id: 'mod',
                    name: 'Moderator',
                    color: '#ff3333',
                    icon: '/images/roles/moderator.png',
                    priority: 10
                }
            ],
            milestones: [
                {
                    level: 1,
                    reward: 'Newcomer Role',
                    unlocked: true
                },
                {
                    level: 3,
                    reward: 'Cyber Knight Role',
                    unlocked: true
                },
                {
                    level: 5,
                    reward: 'Custom Profile Banner',
                    unlocked: false
                },
                {
                    level: 7,
                    reward: 'Elite Terminal Theme',
                    unlocked: false
                },
                {
                    level: 10,
                    reward: 'Special Avatar Frame',
                    unlocked: false
                },
                {
                    level: 15,
                    reward: 'Animated Profile Effects',
                    unlocked: false
                },
                {
                    level: 20,
                    reward: 'Veteran Role + Custom Color Scheme',
                    unlocked: false
                }
            ]
        };
    }
}

export default ServerProgressionService;