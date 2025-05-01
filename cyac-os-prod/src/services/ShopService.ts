/**
 * Service for managing the shop system
 * Provides functionality for browsing, filtering, and purchasing items
 */

interface StoreItem {
    id: string;
    name: string;
    description: string;
    image: string;
    category: 'role' | 'theme' | 'item' | 'avatar' | 'banner';
    price: number;
    discountPercent?: number;
    game?: string;  // If the item belongs to a specific game
    metadata?: any; // Additional properties for specific item types
    isOwned?: boolean; // Dynamically set for UI display
    isNew?: boolean;   // Indicates new items
    isFeatured?: boolean; // Featured in the shop
}

// Categories for filtering
export type ShopCategory = 'all' | 'role' | 'theme' | 'item' | 'avatar' | 'banner';

// Sort options
export type ShopSortOption =
    | 'price-low-high'
    | 'price-high-low'
    | 'newest'
    | 'alphabetical'
    | 'featured';

export class ShopService {
    // Local storage keys
    private static readonly SHOP_ITEMS_KEY = 'cyac_shop_items';
    private static readonly FEATURED_ITEMS_KEY = 'cyac_featured_items';

    // Cache to prevent frequent localStorage access
    private static cachedShopItems: StoreItem[] | null = null;
    private static cachedFeaturedItems: string[] | null = null;

    // Event for shop updates
    private static shopUpdateEvent = new CustomEvent('shopUpdated');

    /**
     * Initialize the shop system
     * This would typically fetch from a real API
     * @returns Promise<boolean> Success status
     */
    public static async initialize(): Promise<boolean> {
        try {
            // Check if shop items exist in storage
            const storedItems = localStorage.getItem(this.SHOP_ITEMS_KEY);

            if (!storedItems) {
                // Generate demo shop items for first-time use
                const demoItems = this.generateDemoShopItems();
                localStorage.setItem(this.SHOP_ITEMS_KEY, JSON.stringify(demoItems));
                this.cachedShopItems = demoItems;
            } else {
                this.cachedShopItems = JSON.parse(storedItems);
            }

            // Load featured items
            const storedFeaturedItems = localStorage.getItem(this.FEATURED_ITEMS_KEY);

            if (!storedFeaturedItems) {
                // Set some default featured items
                // Ensure cachedShopItems is not null before using
                if (this.cachedShopItems) {
                    const featuredIds = this.cachedShopItems
                        .filter(() => Math.random() > 0.7) // Randomly select ~30% of items
                        .map(item => item.id);

                    localStorage.setItem(this.FEATURED_ITEMS_KEY, JSON.stringify(featuredIds));
                    this.cachedFeaturedItems = featuredIds;
                } else {
                    // If cachedShopItems is null, initialize with empty array
                    this.cachedFeaturedItems = [];
                    localStorage.setItem(this.FEATURED_ITEMS_KEY, JSON.stringify([]));
                }
            } else {
                this.cachedFeaturedItems = JSON.parse(storedFeaturedItems);
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize shop:', error);
            return false;
        }
    }

    /**
     * Get all shop items, with ownership status
     * @returns Promise<StoreItem[]> Array of shop items
     */
    public static async getShopItems(): Promise<StoreItem[]> {
        try {
            if (this.cachedShopItems === null) {
                await this.initialize();
            }

            if (!this.cachedShopItems) {
                throw new Error('Shop items not initialized');
            }

            // Import dynamically to avoid circular dependencies
            const { PointsService } = await import('./PointsService');

            // Mark items as owned if applicable
            const itemsWithOwnership = await Promise.all(
                this.cachedShopItems.map(async (item) => ({
                    ...item,
                    isOwned: await PointsService.isItemOwned(item.id),
                    isFeatured: this.cachedFeaturedItems?.includes(item.id) || false
                }))
            );

            return itemsWithOwnership;
        } catch (error) {
            console.error('Failed to get shop items:', error);
            return [];
        }
    }

    /**
     * Get filtered shop items
     * @param category Category to filter by (optional)
     * @param gameFilter Game to filter by (optional)
     * @param sortOption How to sort the items (optional)
     * @param showOwned Whether to include owned items (optional)
     * @returns Promise<StoreItem[]> Filtered shop items
     */
    public static async getFilteredShopItems(
        category: ShopCategory = 'all',
        gameFilter: string = 'all',
        sortOption: ShopSortOption = 'price-low-high',
        showOwned: boolean = true
    ): Promise<StoreItem[]> {
        try {
            let items = await this.getShopItems();

            // Filter by category
            if (category !== 'all') {
                items = items.filter(item => item.category === category);
            }

            // Filter by game
            if (gameFilter !== 'all') {
                items = items.filter(item => item.game === gameFilter || !item.game);
            }

            // Filter owned items if requested
            if (!showOwned) {
                items = items.filter(item => !item.isOwned);
            }

            // Apply sorting
            switch (sortOption) {
                case 'price-low-high':
                    items.sort((a, b) => {
                        const priceA = a.discountPercent
                            ? a.price * (1 - a.discountPercent / 100)
                            : a.price;
                        const priceB = b.discountPercent
                            ? b.price * (1 - b.discountPercent / 100)
                            : b.price;
                        return priceA - priceB;
                    });
                    break;

                case 'price-high-low':
                    items.sort((a, b) => {
                        const priceA = a.discountPercent
                            ? a.price * (1 - a.discountPercent / 100)
                            : a.price;
                        const priceB = b.discountPercent
                            ? b.price * (1 - b.discountPercent / 100)
                            : b.price;
                        return priceB - priceA;
                    });
                    break;

                case 'newest':
                    items.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
                    break;

                case 'alphabetical':
                    items.sort((a, b) => a.name.localeCompare(b.name));
                    break;

                case 'featured':
                    items.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
                    break;
            }

            return items;
        } catch (error) {
            console.error('Failed to get filtered shop items:', error);
            return [];
        }
    }

    /**
     * Get featured shop items
     * @returns Promise<StoreItem[]> Featured shop items
     */
    public static async getFeaturedItems(): Promise<StoreItem[]> {
        try {
            if (this.cachedFeaturedItems === null || this.cachedShopItems === null) {
                await this.initialize();
            }

            if (!this.cachedFeaturedItems || !this.cachedShopItems) {
                throw new Error('Shop not initialized');
            }

            // Find featured items from the full shop
            const featuredItems = this.cachedShopItems.filter(
                item => this.cachedFeaturedItems?.includes(item.id)
            );

            // Mark items as owned
            const { PointsService } = await import('./PointsService');

            const itemsWithOwnership = await Promise.all(
                featuredItems.map(async (item) => ({
                    ...item,
                    isOwned: await PointsService.isItemOwned(item.id),
                    isFeatured: true
                }))
            );

            return itemsWithOwnership;
        } catch (error) {
            console.error('Failed to get featured items:', error);
            return [];
        }
    }

    /**
     * Get all available games that have items in the shop
     * @returns Promise<{id: string, name: string}[]> Game options
     */
    public static async getShopGameOptions(): Promise<{id: string, name: string}[]> {
        try {
            const items = await this.getShopItems();

            // Extract unique game IDs
            const gameIds = [...new Set(
                items
                    .filter(item => item.game) // Only items with game property
                    .map(item => item.game as string)
            )];

            // Format game names
            return gameIds.map(gameId => ({
                id: gameId,
                name: this.formatGameName(gameId)
            }));
        } catch (error) {
            console.error('Failed to get shop game options:', error);
            return [];
        }
    }

    /**
     * Add a new item to the shop
     * Useful for games to register their own items
     * @param item The item to add
     * @returns Promise<boolean> Success status
     */
    public static async addShopItem(item: StoreItem): Promise<boolean> {
        try {
            if (this.cachedShopItems === null) {
                await this.initialize();
            }

            if (!this.cachedShopItems) {
                throw new Error('Shop items not initialized');
            }

            // Check if item with this ID already exists
            const existingItemIndex = this.cachedShopItems.findIndex(i => i.id === item.id);

            if (existingItemIndex !== -1) {
                // Update existing item
                this.cachedShopItems[existingItemIndex] = {
                    ...item,
                    isNew: true // Mark as new when updated
                };
            } else {
                // Add new item
                this.cachedShopItems.push({
                    ...item,
                    isNew: true // Mark as new
                });
            }

            // Save to storage
            localStorage.setItem(this.SHOP_ITEMS_KEY, JSON.stringify(this.cachedShopItems));

            // Dispatch event
            window.dispatchEvent(this.shopUpdateEvent);

            return true;
        } catch (error) {
            console.error('Failed to add shop item:', error);
            return false;
        }
    }

    /**
     * Set an item as featured
     * @param itemId ID of the item to feature
     * @param isFeatured Whether the item should be featured
     * @returns Promise<boolean> Success status
     */
    public static async setItemFeatured(
        itemId: string,
        isFeatured: boolean
    ): Promise<boolean> {
        try {
            if (this.cachedFeaturedItems === null) {
                await this.initialize();
            }

            if (!this.cachedFeaturedItems) {
                throw new Error('Featured items not initialized');
            }

            if (isFeatured) {
                // Add to featured if not already there
                if (!this.cachedFeaturedItems.includes(itemId)) {
                    this.cachedFeaturedItems.push(itemId);
                }
            } else {
                // Remove from featured
                this.cachedFeaturedItems = this.cachedFeaturedItems.filter(id => id !== itemId);
            }

            // Save to storage
            localStorage.setItem(this.FEATURED_ITEMS_KEY, JSON.stringify(this.cachedFeaturedItems));

            // Dispatch event
            window.dispatchEvent(this.shopUpdateEvent);

            return true;
        } catch (error) {
            console.error('Failed to update featured status:', error);
            return false;
        }
    }

    /**
     * Purchase an item from the shop
     * @param itemId ID of the item to purchase
     * @returns Promise<boolean> Success status
     */
    public static async purchaseItem(itemId: string): Promise<boolean> {
        try {
            const { PointsService } = await import('./PointsService');
            return await PointsService.purchaseItem(itemId);
        } catch (error) {
            console.error('Failed to purchase item:', error);
            return false;
        }
    }

    /**
     * Clear the cache to force reload from storage
     */
    public static clearCache(): void {
        this.cachedShopItems = null;
        this.cachedFeaturedItems = null;
    }

    // PRIVATE METHODS

    /**
     * Format a game ID into a readable name
     * @param gameId Game ID to format
     * @returns Formatted game name
     */
    private static formatGameName(gameId: string): string {
        return gameId.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Generate demo shop items for initial setup
     * @returns Array of demo shop items
     */
    private static generateDemoShopItems(): StoreItem[] {
        return [
            // Roles
            {
                id: 'role_hacker_elite',
                name: 'Elite Hacker Role',
                description: 'Show off your elite hacking skills with this exclusive role',
                image: '/images/shop/roles/elite-hacker.png',
                category: 'role',
                price: 500,
                metadata: {
                    roleData: {
                        id: 'elite_hacker',
                        name: 'Elite Hacker',
                        color: '#33ff99',
                        icon: '/images/roles/elite-hacker.png',
                        priority: 5
                    }
                }
            },
            {
                id: 'role_digital_artist',
                name: 'Digital Artist Role',
                description: 'A special role for creative minds',
                image: '/images/shop/roles/digital-artist.png',
                category: 'role',
                price: 300,
                metadata: {
                    roleData: {
                        id: 'digital_artist',
                        name: 'Digital Artist',
                        color: '#ff66cc',
                        icon: '/images/roles/digital-artist.png',
                        priority: 4
                    }
                }
            },

            // Themes
            {
                id: 'theme_neon_city',
                name: 'Neon City Theme',
                description: 'Transform your terminal into a cyberpunk neon cityscape',
                image: '/images/shop/themes/neon-city.png',
                category: 'theme',
                price: 250,
                metadata: {
                    themeData: {
                        id: 'neon_city',
                        primaryColor: '#ff33cc',
                        secondaryColor: '#33ccff',
                        backgroundColor: '#121212'
                    }
                }
            },
            {
                id: 'theme_retro_wave',
                name: 'Retro Wave Theme',
                description: '80s inspired synthwave aesthetic for your system',
                image: '/images/shop/themes/retro-wave.png',
                category: 'theme',
                price: 200,
                discountPercent: 15,
                isNew: true,
                metadata: {
                    themeData: {
                        id: 'retro_wave',
                        primaryColor: '#ff6699',
                        secondaryColor: '#66ffff',
                        backgroundColor: '#220033'
                    }
                }
            },

            // Avatars
            {
                id: 'avatar_cyborg',
                name: 'Cyborg Avatar',
                description: 'Half human, half machine - all awesome',
                image: '/images/shop/avatars/cyborg.png',
                category: 'avatar',
                price: 350,
                metadata: {
                    rarity: 'epic'
                }
            },
            {
                id: 'avatar_holo_mask',
                name: 'Holographic Mask',
                description: 'A mysterious holographic mask to hide your identity',
                image: '/images/shop/avatars/holo-mask.png',
                category: 'avatar',
                price: 400,
                metadata: {
                    rarity: 'rare',
                    effect: 'animated'
                }
            },

            // Banners
            {
                id: 'banner_circuit',
                name: 'Circuit Board Banner',
                description: 'Show off with this animated circuit board banner',
                image: '/images/shop/banners/circuit.png',
                category: 'banner',
                price: 300,
                metadata: {
                    rarity: 'uncommon',
                    effect: 'animated'
                }
            },
            {
                id: 'banner_matrix',
                name: 'Matrix Code Banner',
                description: 'Falling green code animation for your profile',
                image: '/images/shop/banners/matrix.png',
                category: 'banner',
                price: 450,
                metadata: {
                    rarity: 'epic',
                    effect: 'animated'
                }
            },

            // Game items
            {
                id: 'spaceshooter_ship_nova',
                name: 'Nova Starfighter',
                description: 'The fastest ship in the galaxy with special shielding',
                image: '/images/shop/games/nova-starfighter.png',
                category: 'item',
                price: 600,
                game: 'space_shooter',
                metadata: {
                    rarity: 'legendary',
                    gameItemType: 'ship',
                    stats: {
                        speed: 10,
                        shield: 8,
                        firepower: 9
                    }
                }
            },
            {
                id: 'spaceshooter_weapon_plasma',
                name: 'Plasma Cannon',
                description: 'Advanced weapon that bypasses regular shields',
                image: '/images/shop/games/plasma-cannon.png',
                category: 'item',
                price: 350,
                game: 'space_shooter',
                discountPercent: 20,
                metadata: {
                    rarity: 'epic',
                    gameItemType: 'weapon',
                    stats: {
                        damage: 85,
                        cooldown: 2.0,
                        range: 300
                    }
                }
            },
            {
                id: 'retropuzzle_powerup_timeslow',
                name: 'Time Dilation',
                description: 'Slow down time to solve puzzles more easily',
                image: '/images/shop/games/time-dilation.png',
                category: 'item',
                price: 200,
                game: 'retro_puzzle',
                metadata: {
                    rarity: 'rare',
                    gameItemType: 'powerup',
                    uses: 5
                }
            },
            {
                id: 'cyberquest_tool_decrypter',
                name: 'Quantum Decrypter',
                description: 'Instantly decrypt even the most complex codes',
                image: '/images/shop/games/quantum-decrypter.png',
                category: 'item',
                price: 500,
                game: 'cyberquest',
                metadata: {
                    rarity: 'legendary',
                    gameItemType: 'tool',
                    uses: 3
                }
            }
        ];
    }
}

export default ShopService;