/**
 * Service for managing user inventory items
 */

interface InventoryItem {
    id: string;
    name: string;
    description: string;
    image: string;
    game: string;
    type: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    quantity: number;
    metadata?: any;
}

export class InventoryService {
    // Local storage key for inventory data
    private static readonly STORAGE_KEY = 'cyac_user_inventory';

    // Cached inventory to prevent frequent localStorage access
    private static cachedInventory: InventoryItem[] | null = null;

    /**
     * Get all inventory items for the current user
     * @returns Promise<InventoryItem[]> List of user inventory items
     */
    public static async getUserInventory(): Promise<InventoryItem[]> {
        // If we have a cached version, return it
        if (this.cachedInventory) {
            return this.cachedInventory;
        }

        // Mock delay for simulating API call
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            // Try to get from localStorage
            const inventoryData = localStorage.getItem(this.STORAGE_KEY);

            if (inventoryData) {
                // Parse stored data
                const inventory = JSON.parse(inventoryData) as InventoryItem[];

                // Cache the result
                this.cachedInventory = inventory;
                return inventory;
            }

            // If no data exists, generate demo inventory
            const demoInventory = this.generateDemoInventory();

            // Cache and store the demo data
            this.cachedInventory = demoInventory;
            this.saveInventory(demoInventory);

            return demoInventory;
        } catch (error) {
            console.error('Error getting user inventory:', error);
            return [];
        }
    }

    /**
     * Get inventory items for a specific game
     * @param gameId The game ID to filter by
     * @returns Promise<InventoryItem[]> List of items for the specified game
     */
    public static async getGameInventory(gameId: string): Promise<InventoryItem[]> {
        const allItems = await this.getUserInventory();
        return allItems.filter(item => item.game === gameId);
    }

    /**
     * Add an item to the user's inventory
     * @param item The item to add
     * @returns Promise<boolean> Success status
     */
    public static async addItem(item: InventoryItem): Promise<boolean> {
        try {
            const inventory = await this.getUserInventory();

            // Check if item already exists
            const existingItemIndex = inventory.findIndex(i => i.id === item.id);

            if (existingItemIndex !== -1) {
                // Update quantity if item exists
                inventory[existingItemIndex].quantity += item.quantity;
            } else {
                // Add new item
                inventory.push(item);
            }

            // Save changes
            this.saveInventory(inventory);
            return true;
        } catch (error) {
            console.error('Error adding item to inventory:', error);
            return false;
        }
    }

    /**
     * Update an existing inventory item
     * @param itemId ID of the item to update
     * @param updates Object with properties to update
     * @returns Promise<boolean> Success status
     */
    public static async updateItem(
        itemId: string,
        updates: Partial<InventoryItem>
    ): Promise<boolean> {
        try {
            const inventory = await this.getUserInventory();
            const itemIndex = inventory.findIndex(i => i.id === itemId);

            if (itemIndex === -1) {
                return false;
            }

            // Update item properties
            inventory[itemIndex] = {
                ...inventory[itemIndex],
                ...updates
            };

            // Save changes
            this.saveInventory(inventory);
            return true;
        } catch (error) {
            console.error('Error updating inventory item:', error);
            return false;
        }
    }

    /**
     * Remove an item from inventory
     * @param itemId ID of the item to remove
     * @param quantity Quantity to remove (defaults to all)
     * @returns Promise<boolean> Success status
     */
    public static async removeItem(
        itemId: string,
        quantity?: number
    ): Promise<boolean> {
        try {
            const inventory = await this.getUserInventory();
            const itemIndex = inventory.findIndex(i => i.id === itemId);

            if (itemIndex === -1) {
                return false;
            }

            const item = inventory[itemIndex];

            if (quantity && quantity < item.quantity) {
                // Reduce quantity
                item.quantity -= quantity;
            } else {
                // Remove item completely
                inventory.splice(itemIndex, 1);
            }

            // Save changes
            this.saveInventory(inventory);
            return true;
        } catch (error) {
            console.error('Error removing inventory item:', error);
            return false;
        }
    }

    /**
     * Add multiple items from a game to the inventory
     * Useful for games to register rewards
     * @param gameId The game ID
     * @param items Array of items to add
     * @returns Promise<boolean> Success status
     */
    public static async addGameItems(
        gameId: string,
        items: Omit<InventoryItem, 'game'>[]
    ): Promise<boolean> {
        try {
            const inventory = await this.getUserInventory();

            // Process each item
            for (const itemData of items) {
                const item = {
                    ...itemData,
                    game: gameId
                };

                // Check if item already exists
                const existingItemIndex = inventory.findIndex(i => i.id === item.id);

                if (existingItemIndex !== -1) {
                    // Update quantity if item exists
                    inventory[existingItemIndex].quantity += item.quantity;
                } else {
                    // Add new item
                    inventory.push(item);
                }
            }

            // Save changes
            this.saveInventory(inventory);
            return true;
        } catch (error) {
            console.error('Error adding game items to inventory:', error);
            return false;
        }
    }

    /**
     * Clear the inventory cache to force reload from storage
     */
    public static clearCache(): void {
        this.cachedInventory = null;
    }

    /**
     * Save inventory to localStorage
     * @param inventory Inventory array to save
     */
    private static saveInventory(inventory: InventoryItem[]): void {
        // Update cache
        this.cachedInventory = inventory;

        // Save to localStorage
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(inventory));
        } catch (error) {
            console.error('Error saving inventory to localStorage:', error);
        }
    }

    /**
     * Generate demo inventory items for testing
     * @returns InventoryItem[] Array of demo inventory
     */
    private static generateDemoInventory(): InventoryItem[] {
        // Create a variety of items across different games
        return [
            {
                id: 'spaceshooter_ship_falcon',
                name: 'Falcon Fighter',
                description: 'A fast and agile spaceship with balanced stats',
                image: '/images/inventory/falcon-fighter.png',
                game: 'space_shooter',
                type: 'ship',
                rarity: 'uncommon',
                quantity: 1,
                metadata: {
                    speed: 8,
                    shield: 6,
                    firepower: 7
                }
            },
            {
                id: 'spaceshooter_ship_destroyer',
                name: 'Void Destroyer',
                description: 'Heavy battleship with strong shields but slower movement',
                image: '/images/inventory/void-destroyer.png',
                game: 'space_shooter',
                type: 'ship',
                rarity: 'rare',
                quantity: 1,
                metadata: {
                    speed: 4,
                    shield: 9,
                    firepower: 8
                }
            },
            {
                id: 'spaceshooter_weapon_laserbeam',
                name: 'Quantum Laser Beam',
                description: 'Enhanced laser weapon that can penetrate multiple targets',
                image: '/images/inventory/quantum-laser.png',
                game: 'space_shooter',
                type: 'weapon',
                rarity: 'epic',
                quantity: 1,
                metadata: {
                    damage: 75,
                    cooldown: 2.5,
                    penetration: 3
                }
            },
            {
                id: 'spaceshooter_consumable_shield',
                name: 'Shield Booster',
                description: 'Temporarily enhances shield strength by 50%',
                image: '/images/inventory/shield-booster.png',
                game: 'space_shooter',
                type: 'consumable',
                rarity: 'common',
                quantity: 5
            },
            {
                id: 'cyberquest_tool_analyzer',
                name: 'Network Analyzer',
                description: 'Reveals hidden connections in hacking challenges',
                image: '/images/inventory/network-analyzer.png',
                game: 'cyberquest',
                type: 'tool',
                rarity: 'rare',
                quantity: 1,
                metadata: {
                    uses: 'unlimited',
                    unlocked_level: 5
                }
            },
            {
                id: 'cyberquest_cosmetic_terminal',
                name: 'Neon Terminal Skin',
                description: 'Customizes your terminal with a neon cyberpunk theme',
                image: '/images/inventory/neon-terminal.png',
                game: 'cyberquest',
                type: 'cosmetic',
                rarity: 'uncommon',
                quantity: 1
            },
            {
                id: 'cyberquest_consumable_hint',
                name: 'Hint Token',
                description: 'Provides a hint for difficult hacking challenges',
                image: '/images/inventory/hint-token.png',
                game: 'cyberquest',
                type: 'consumable',
                rarity: 'common',
                quantity: 3
            },
            {
                id: 'retropuzzle_theme_synthwave',
                name: 'Synthwave Theme',
                description: 'Changes the puzzle appearance to a synthwave aesthetic',
                image: '/images/inventory/synthwave-theme.png',
                game: 'retro_puzzle',
                type: 'theme',
                rarity: 'uncommon',
                quantity: 1
            },
            {
                id: 'system_avatar_frame_elite',
                name: 'Elite Avatar Frame',
                description: 'A special frame for your profile picture showing your elite status',
                image: '/images/inventory/elite-frame.png',
                game: 'system',
                type: 'cosmetic',
                rarity: 'legendary',
                quantity: 1,
                metadata: {
                    effect: 'animated',
                    unlockMethod: 'Complete all system achievements'
                }
            },
            {
                id: 'system_theme_matrix',
                name: 'Matrix Terminal Theme',
                description: 'Change your terminal to look like the iconic Matrix code rain',
                image: '/images/inventory/matrix-theme.png',
                game: 'system',
                type: 'theme',
                rarity: 'epic',
                quantity: 1
            }
        ];
    }
}

export default InventoryService;