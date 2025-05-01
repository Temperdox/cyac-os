import { Game, Collection, GameLoaderResponse } from './types';

// Sample default collections
const DEFAULT_COLLECTIONS: Collection[] = [
    {
        id: 'arcade',
        name: 'Arcade',
        description: 'Classic arcade-style games',
        sortOrder: 1
    },
    {
        id: 'puzzle',
        name: 'Puzzle',
        description: 'Brain teasers and thinking games',
        sortOrder: 2
    },
    {
        id: 'strategy',
        name: 'Strategy',
        description: 'Strategic planning and resource management',
        sortOrder: 3
    },
    {
        id: 'adventure',
        name: 'Adventure',
        description: 'Exploration and story-driven games',
        sortOrder: 4
    }
];

// Sample fallback games in case dynamic loading fails
const FALLBACK_GAMES: Game[] = [
    {
        id: 'tic-tac-toe',
        title: 'Tic Tac Toe',
        description: 'Classic game of X and O. Get three in a row to win!',
        coverImage: '/game-covers/tic-tac-toe.png',
        component: '/components/viewers/GameLauncher/Games/TicTacToe',
        developer: 'CyberAcme',
        releaseDate: '2025',
        collections: ['arcade', 'puzzle'],
        features: ['singleplayer', 'multiplayer', 'ai-opponent']
    },
    {
        id: 'tetris',
        title: 'Tetris',
        description: 'Classic block-stacking puzzle game',
        coverImage: '/game-covers/tetris.png',
        component: '/components/viewers/GameLauncher/Games/Tetris',
        developer: 'CyberAcme',
        releaseDate: '2025',
        collections: ['arcade', 'puzzle'],
        features: ['singleplayer', 'high-scores']
    },
    {
        id: 'snake',
        title: 'Snake',
        description: 'Control a snake to eat apples and grow longer',
        coverImage: '/game-covers/snake.png',
        component: '/components/viewers/GameLauncher/Games/Snake',
        developer: 'CyberAcme',
        releaseDate: '2025',
        collections: ['arcade'],
        features: ['singleplayer', 'high-scores']
    },
    {
        id: "cyberquest",
        title: "CyberQuest",
        description: "Hack the system, claim the rewards. Navigate through cyber puzzles to earn cR and unlock achievements.",
        coverImage: "/game-covers/cyberquest.png",
        component: "/components/viewers/GameLauncher/Games/CyberQuest",
        developer: "CyberAcme",
        releaseDate: "2025",
        collections: ["puzzle", "strategy"],
        features: ["singleplayer", "achievements", "shop"]
    }
];

/**
 * Check if we have access to the file system API
 */
function hasFileSystemAccess(): boolean {
    return typeof window !== 'undefined' && 'fs' in window && typeof window.fs.readFile === 'function';
}

/**
 * Load game data from the filesystem or manifest
 *
 * This function will attempt to:
 * 1. Read the game manifest file
 * 2. Scan the Games directory for available games
 * 3. Parse metadata from each game
 * 4. Return the combined game and collection data
 */
export async function loadGameData(): Promise<GameLoaderResponse> {
    try {
        // Initialize collections with defaults
        const collections = [...DEFAULT_COLLECTIONS];

        // Initialize with fallback games in case dynamic loading fails
        let games: Game[] = [...FALLBACK_GAMES];

        // Check if we're in a browser environment with access to the filesystem API
        if (hasFileSystemAccess()) {
            try {
                // Path to the games directory
                const gamesPath = '/components/viewers/GameLauncher/Games';

                // Try to load game manifest file first if it exists
                try {
                    const manifestContent = await window.fs.readFile(`${gamesPath}/manifest.json`, { encoding: 'utf8' });
                    if (typeof manifestContent === 'string') {
                        const manifest = JSON.parse(manifestContent);

                        // If manifest has collections, use those
                        if (manifest.collections && Array.isArray(manifest.collections)) {
                            // Merge with default collections
                            const manifestCollections = manifest.collections.map((collection: Collection) => ({
                                ...collection,
                                // Ensure each collection has an id
                                id: collection.id || collection.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
                            }));

                            // Add new collections from manifest
                            for (const collection of manifestCollections) {
                                const existingIndex = collections.findIndex(c => c.id === collection.id);
                                if (existingIndex >= 0) {
                                    // Update existing collection
                                    collections[existingIndex] = {
                                        ...collections[existingIndex],
                                        ...collection
                                    };
                                } else {
                                    // Add new collection
                                    collections.push(collection);
                                }
                            }
                        }

                        // If manifest has games, use those
                        if (manifest.games && Array.isArray(manifest.games)) {
                            games = manifest.games;
                        }
                    }
                } catch (manifestError) {
                    console.warn('Game manifest not found, will scan for games instead:', manifestError);

                    // If no manifest, scan the directory for games
                    try {
                        console.warn('Directory scanning not implemented in this version');

                        // For now, we'll use our fallback games
                    } catch (scanError) {
                        console.error('Failed to scan games directory:', scanError);
                    }
                }
            } catch (fsError) {
                console.error('Failed to access file system:', fsError);
            }
        }

        console.log("Loaded games:", games);

        // Sort collections by sortOrder if present
        collections.sort((a, b) => {
            if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
                return a.sortOrder - b.sortOrder;
            }
            return a.name.localeCompare(b.name);
        });

        return { games, collections };
    } catch (error) {
        console.error('Failed to load game data:', error);
        // Return default data in case of error
        return {
            games: FALLBACK_GAMES,
            collections: DEFAULT_COLLECTIONS
        };
    }
}

/**
 * Creates a placeholder image URL for game covers when no image is available
 */
export function createPlaceholderImage(gameTitle: string): string {
    // Create a simple data URL with the game title
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        // Draw background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw border
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

        // Draw text
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Wrap text if needed
        const maxWidth = canvas.width - 40;
        const words = gameTitle.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' ' + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth) {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);

        // Draw each line
        const lineHeight = 30;
        const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], canvas.width / 2, startY + i * lineHeight);
        }

        // Draw "No Image" text
        ctx.font = '16px "Courier New", monospace';
        ctx.fillText('[ NO IMAGE ]', canvas.width / 2, canvas.height - 30);
    }

    return canvas.toDataURL('image/png');
}