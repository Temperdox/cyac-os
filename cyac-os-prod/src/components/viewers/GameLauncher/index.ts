import GameLauncher from './GameLauncher';
import GameCard from './GameCard';
import GameCollection from './GameCollection';
import { loadGameData, createPlaceholderImage } from './gameLoader';

// Use "export type" for type re-exports when isolatedModules is enabled
export type { Game, Collection } from './types';

export {
    GameLauncher,
    GameCard,
    GameCollection,
    loadGameData,
    createPlaceholderImage
};

// Default export is the main GameLauncher component
export default GameLauncher;