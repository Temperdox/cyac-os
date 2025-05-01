// Game States
export type GameState =
    | 'loading'
    | 'main_menu'
    | 'level_select'
    | 'playing'
    | 'level_complete'
    | 'shop'
    | 'inventory'
    | 'tutorial'
    | 'error';

// Player Data
export interface PlayerData {
    id: string;
    username: string;
    points: number;
    level: number;
    experience: number;
    completedLevels: CompletedLevel[];
    inventory: InventoryItem[];
    settings: PlayerSettings;
    createdAt: string;
    lastLogin: string;
}

// Completed Level Record
export interface CompletedLevel {
    id: string;
    score: number;
    perfect: boolean;
    timestamp: string;
}

// Player Inventory Item
export interface InventoryItem {
    id: string;
    name: string;
    type: ItemType;
    description: string;
    rarity: ItemRarity;
    effects: ItemEffect[];
    acquired: string;
    quantity?: number;
}

// Item Types
export type ItemType =
    | 'tool'
    | 'upgrade'
    | 'powerup'
    | 'cosmetic';

// Item Rarities
export type ItemRarity =
    | 'common'
    | 'uncommon'
    | 'rare'
    | 'epic'
    | 'legendary';

// Item Effects
export interface ItemEffect {
    type: EffectType;
    value: number | string;
    duration?: number; // In seconds, undefined for permanent
}

// Effect Types
export type EffectType =
    | 'speed_boost'
    | 'damage_boost'
    | 'time_slow'
    | 'hint'
    | 'auto_solve'
    | 'score_multiplier'
    | 'extra_time'
    | 'reveal_path'
    | 'puzzle_difficulty'
    | 'collect_radius'
    | 'custom';

// Player Settings
export interface PlayerSettings {
    soundEnabled: boolean;
    musicEnabled: boolean;
    sfxVolume: number;
    musicVolume: number;
    difficulty: DifficultyLevel;
    colorScheme: string;
}

// Difficulty Levels
export type DifficultyLevel =
    | 'easy'
    | 'normal'
    | 'hard';

// Level Definitions
export interface Level {
    id: string;
    name: string;
    description: string;
    difficulty: DifficultyLevel;
    type: LevelType;
    data: LevelData;
    maxScore: number;
    timeLimit?: number; // In seconds, optional
    miniGames?: MiniGame[];
    rewards: LevelRewards;
    requirements?: LevelRequirements;
    order: number;
}

// Level Types
export type LevelType =
    | 'puzzle'
    | 'hacking'
    | 'maze'
    | 'stealth'
    | 'decryption'
    | 'sequence'
    | 'logic';

// Generic Level Data (extended by specific level types)
export interface LevelData {
    intro?: string;
    outro?: string;
    backgroundImage?: string;
    ambientSound?: string;
    entityData?: EntityData[];
    gridSize?: { width: number; height: number };
    objectives: Objective[];
    mazeLayout?: number[][];
}

// Entity Data for Level
export interface EntityData {
    id: string;
    type: string;
    position: { x: number; y: number; z?: number };
    properties?: Record<string, any>;
}

// Level Objectives
export interface Objective {
    id: string;
    description: string;
    type: ObjectiveType;
    target: string | number;
    points: number;
    completed?: boolean;
}

// Objective Types
export type ObjectiveType =
    | 'collect'
    | 'activate'
    | 'hack'
    | 'reach'
    | 'solve'
    | 'defeat'
    | 'protect'
    | 'find'
    | 'custom';

// Mini Games within Levels
export interface MiniGame {
    id: string;
    type: MiniGameType;
    data: Record<string, any>;
    rewards: { points: number };
}

// Mini Game Types
export type MiniGameType =
    | 'lockpick'
    | 'password_crack'
    | 'pattern_match'
    | 'wire_connect'
    | 'memory'
    | 'timing';

// Level Rewards
export interface LevelRewards {
    points: number;
    bonusPoints: number;
    experience: number;
    items?: string[]; // Item IDs that can be awarded
    unlocks?: string[]; // Level IDs that get unlocked
}

// Level Requirements
export interface LevelRequirements {
    playerLevel?: number;
    completedLevels?: string[];
    items?: string[];
    points?: number;
}

// Shop Items
export interface ShopItem {
    id: string;
    name: string;
    description: string;
    type: ItemType;
    price: number;
    rarity: ItemRarity;
    effects: ItemEffect[];
    image: string;
    category?: string;
    unlockRequirement?: {
        type: 'level' | 'points' | 'achievement';
        value: string | number;
    };
    consumable?: boolean;
    quantity?: number;
}

// Achievement Definition
export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    rarity: ItemRarity;
    unlocked: boolean;
    unlockedAt?: Date;
    game: string;
}

// Game Configuration
export interface GameConfig {
    version: string;
    shopItems: ShopItem[];
    settings: {
        defaultDifficulty: DifficultyLevel;
        pointsMultiplier: number;
        experienceMultiplier: number;
        timeLimit: number; // Default time limit in seconds
    };
    enemies: Enemy[];
    powerups: Powerup[];
    themes: Theme[];
}

// Enemy Definition
export interface Enemy {
    id: string;
    name: string;
    type: string;
    health: number;
    damage: number;
    speed: number;
    detectionRadius: number;
    abilities: string[];
    loot?: LootTable[];
}

// Loot Table
export interface LootTable {
    itemId: string;
    chance: number; // 0-1 probability
    minQuantity: number;
    maxQuantity: number;
}

// Powerup Definition
export interface Powerup {
    id: string;
    name: string;
    description: string;
    duration: number; // In seconds
    effect: ItemEffect;
    image: string;
}

// Theme Definition
export interface Theme {
    id: string;
    name: string;
    description: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    fontFamily: string;
    unlockRequirement?: {
        type: 'level' | 'points' | 'achievement';
        value: string | number;
    };
}