import { FileSystem } from '../../../services/FileSystem';

/**
 * Register all games with the FileSystem
 * This function should be called during application initialization
 */
export function registerGames(): void {
    try {
        console.log('Registering games with the file system...');

        // Register main Game Launcher component in programs directory
        FileSystem.registerComponent(
            '/home/user/programs',
            'GameLauncher',
            '/components/viewers/GameLauncher',
            'program',
            'CyberAcme Game Center'
        );

        // Create games directory if it doesn't exist yet
        if (!FileSystem.exists('/home/user/programs/games')) {
            console.log('Creating games directory...');
            // In a real implementation, we would create the directory here
            // For now, we'll rely on the default directory structure
        }

        // Register individual games in the games directory for direct access
        const gamesPath = '/home/user/programs/games';

        // TicTacToe
        FileSystem.registerComponent(
            gamesPath,
            'TicTacToe',
            '/components/viewers/GameLauncher/Games/TicTacToe',
            'program',
            'Tic Tac Toe'
        );

        // Tetris (placeholder)
        FileSystem.registerComponent(
            gamesPath,
            'Tetris',
            '/components/viewers/GameLauncher/Games/Tetris',
            'program',
            'Tetris'
        );

        // Snake (placeholder)
        FileSystem.registerComponent(
            gamesPath,
            'Snake',
            '/components/viewers/GameLauncher/Games/Snake',
            'program',
            'Snake'
        );

        console.log('Game registration complete');
    } catch (error) {
        console.error('Failed to register games:', error);
    }
}

/**
 * Initialize the Game Launcher system
 * This function should be called during application startup
 */
export function initializeGameLauncher(): void {
    try {
        // Register games with the file system
        registerGames();

        // Load game data to initialize cache
        import('./gameLoader')
            .then(({ loadGameData }) => {
                loadGameData().then(data => {
                    console.log(`Loaded ${data.games.length} games and ${data.collections.length} collections`);
                });
            })
            .catch(error => {
                console.error('Failed to preload game data:', error);
            });
    } catch (error) {
        console.error('Failed to initialize Game Launcher:', error);
    }
}