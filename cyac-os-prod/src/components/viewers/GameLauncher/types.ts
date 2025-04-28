// Game interface definition
export interface Game {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    component: string; // Path to the React component that implements the game
    developer: string;
    releaseDate: string;
    collections: string[]; // IDs of collections this game belongs to
    features?: string[]; // Special features or tags for the game
    // Add more properties as needed
}

// Collection interface for categorizing games
export interface Collection {
    id: string;
    name: string;
    description: string;
    icon?: string; // Optional icon for the collection
    sortOrder?: number; // Optional sorting order
}

// Response from the game loader
export interface GameLoaderResponse {
    games: Game[];
    collections: Collection[];
}