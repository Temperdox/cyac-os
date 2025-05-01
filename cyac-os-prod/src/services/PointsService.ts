/**
 * Service for managing user points system
 * Allows earning, spending, and tracking points across the system
 */

interface PointsTransaction {
    id: string;
    timestamp: Date;
    amount: number;
    type: 'earn' | 'spend';
    source: string;
    description: string;
}

// @ts-ignore
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

export class PointsService {
    // Local storage keys
    private static readonly POINTS_KEY = 'cyac_user_points';
    private static readonly TRANSACTIONS_KEY = 'cyac_points_transactions';
    private static readonly PURCHASED_ITEMS_KEY = 'cyac_purchased_items';

    // Cache to prevent frequent localStorage access
    private static cachedPoints: number | null = null;
    private static cachedTransactions: PointsTransaction[] | null = null;
    private static cachedPurchasedItems: string[] | null = null;

    // Event for external systems to listen to points changes
    private static pointsChangeEvent = new CustomEvent('pointsChanged');
    private static pointsErrorEvent = new CustomEvent('pointsError');

    /**
     * Initialize the points system
     * @returns Promise<boolean> Success status
     */
    public static async initialize(): Promise<boolean> {
        try {
            // Load points from storage or set default
            const storedPoints = localStorage.getItem(this.POINTS_KEY);

            if (storedPoints) {
                this.cachedPoints = parseInt(storedPoints, 10);
            } else {
                // Set default starting points for new users
                this.cachedPoints = 100;
                localStorage.setItem(this.POINTS_KEY, '100');
            }

            // Load purchased items
            const storedPurchasedItems = localStorage.getItem(this.PURCHASED_ITEMS_KEY);

            if (storedPurchasedItems) {
                this.cachedPurchasedItems = JSON.parse(storedPurchasedItems);
            } else {
                this.cachedPurchasedItems = [];
                localStorage.setItem(this.PURCHASED_ITEMS_KEY, JSON.stringify([]));
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize points system:', error);

            // Dispatch error event
            window.dispatchEvent(this.pointsErrorEvent);

            return false;
        }
    }

    /**
     * Get current points balance
     * @returns Promise<number> Current points balance
     */
    public static async getPoints(): Promise<number> {
        if (this.cachedPoints === null) {
            await this.initialize();
        }

        return this.cachedPoints || 0;
    }

    /**
     * Get current points balance synchronously (for UI)
     * @returns number Current points balance
     */
    public static getPointsSync(): number {
        if (this.cachedPoints === null) {
            const storedPoints = localStorage.getItem(this.POINTS_KEY);
            this.cachedPoints = storedPoints ? parseInt(storedPoints, 10) : 0;
        }

        return this.cachedPoints || 0;
    }

    /**
     * Add points to the user's balance
     * @param amount Amount of points to add
     * @param source Source of the points (e.g., 'daily-login', 'achievement', 'game')
     * @param description Description of the transaction
     * @returns Promise<number> New points balance
     */
    public static async addPoints(
        amount: number,
        source: string,
        description: string
    ): Promise<number> {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        try {
            // Get current points
            const currentPoints = await this.getPoints();

            // Add points
            const newBalance = currentPoints + amount;

            // Save to storage
            localStorage.setItem(this.POINTS_KEY, newBalance.toString());

            // Update cache
            this.cachedPoints = newBalance;

            // Record transaction
            await this.recordTransaction({
                id: this.generateTransactionId(),
                timestamp: new Date(),
                amount,
                type: 'earn',
                source,
                description
            });

            // Dispatch event for external listeners
            window.dispatchEvent(this.pointsChangeEvent);

            return newBalance;
        } catch (error) {
            console.error('Failed to add points:', error);

            // Dispatch error event
            window.dispatchEvent(this.pointsErrorEvent);

            throw error;
        }
    }

    /**
     * Spend points from the user's balance
     * @param amount Amount of points to spend
     * @param source Source of the spending (e.g., 'shop', 'game')
     * @param description Description of the transaction
     * @returns Promise<number> New points balance
     */
    public static async spendPoints(
        amount: number,
        source: string,
        description: string
    ): Promise<number> {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        try {
            // Get current points
            const currentPoints = await this.getPoints();

            // Check if user has enough points
            if (currentPoints < amount) {
                throw new Error('Insufficient points');
            }

            // Subtract points
            const newBalance = currentPoints - amount;

            // Save to storage
            localStorage.setItem(this.POINTS_KEY, newBalance.toString());

            // Update cache
            this.cachedPoints = newBalance;

            // Record transaction
            await this.recordTransaction({
                id: this.generateTransactionId(),
                timestamp: new Date(),
                amount,
                type: 'spend',
                source,
                description
            });

            // Dispatch event for external listeners
            window.dispatchEvent(this.pointsChangeEvent);

            return newBalance;
        } catch (error) {
            console.error('Failed to spend points:', error);

            // Dispatch error event
            window.dispatchEvent(this.pointsErrorEvent);

            throw error;
        }
    }

    /**
     * Get transaction history
     * @param limit Optional limit on number of transactions to return
     * @returns Promise<PointsTransaction[]> Array of transactions
     */
    public static async getTransactions(limit?: number): Promise<PointsTransaction[]> {
        try {
            if (this.cachedTransactions === null) {
                const storedTransactions = localStorage.getItem(this.TRANSACTIONS_KEY);

                if (storedTransactions) {
                    const parsed = JSON.parse(storedTransactions) as PointsTransaction[];

                    // Convert string dates to Date objects
                    parsed.forEach(transaction => {
                        transaction.timestamp = new Date(transaction.timestamp);
                    });

                    this.cachedTransactions = parsed;
                } else {
                    this.cachedTransactions = [];
                }
            }

            // Sort by most recent first - ensure cachedTransactions is not null
            const transactions = this.cachedTransactions || [];
            const sorted = [...transactions].sort(
                (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
            );

            // Apply limit if specified
            return limit ? sorted.slice(0, limit) : sorted;
        } catch (error) {
            console.error('Failed to get transactions:', error);
            return [];
        }
    }

    /**
     * Purchase an item from the shop
     * @param itemId ID of the item to purchase
     * @returns Promise<boolean> Success status
     */
    public static async purchaseItem(itemId: string): Promise<boolean> {
        try {
            // Get the item from the shop
            const shop = await ShopService.getShopItems();
            const item = shop.find(i => i.id === itemId);

            if (!item) {
                throw new Error('Item not found');
            }

            // Check if already owned
            if (await this.isItemOwned(itemId)) {
                throw new Error('Item already owned');
            }

            // Calculate actual price (considering discounts)
            const finalPrice = item.discountPercent
                ? Math.floor(item.price * (1 - item.discountPercent / 100))
                : item.price;

            // Spend points
            await this.spendPoints(
                finalPrice,
                'shop',
                `Purchased ${item.name}`
            );

            // Add to purchased items
            await this.addPurchasedItem(itemId);

            // Handle specific item types
            switch (item.category) {
                case 'role':
                    // Add role to user
                    const roleData = item.metadata?.roleData;
                    if (roleData) {
                        await ServerProgressionService.addRole(roleData);
                    }
                    break;

                case 'theme':
                    // Apply theme if it's the active theme
                    // This would be implemented in a ThemeService
                    break;

                // Handle other item types
                default:
                    // For generic items, just add to inventory
                    if (item.game) {
                        // If it's a game item, add it to the game's inventory
                        await InventoryService.addItem({
                            id: item.id,
                            name: item.name,
                            description: item.description,
                            image: item.image,
                            game: item.game,
                            type: item.category,
                            rarity: item.metadata?.rarity || 'common',
                            quantity: 1,
                            metadata: item.metadata
                        });
                    }
                    break;
            }

            return true;
        } catch (error) {
            console.error('Failed to purchase item:', error);

            // Dispatch error event
            window.dispatchEvent(this.pointsErrorEvent);

            throw error;
        }
    }

    /**
     * Check if an item is owned by the user
     * @param itemId ID of the item to check
     * @returns Promise<boolean> Whether the item is owned
     */
    public static async isItemOwned(itemId: string): Promise<boolean> {
        if (this.cachedPurchasedItems === null) {
            const storedItems = localStorage.getItem(this.PURCHASED_ITEMS_KEY);
            this.cachedPurchasedItems = storedItems ? JSON.parse(storedItems) : [];
        }

        // Add null check to prevent TypeScript error
        return this.cachedPurchasedItems ? this.cachedPurchasedItems.includes(itemId) : false;
    }

    /**
     * Expose the points system to external WebGL games
     * Attaches methods to window object for access
     */
    public static exposeToExternalGames(): void {
        if (typeof window !== 'undefined') {
            (window as any).cyacPointsSystem = {
                getPoints: async () => await this.getPoints(),
                addPoints: async (amount: number, source: string, description: string) =>
                    await this.addPoints(amount, source, description),
                spendPoints: async (amount: number, source: string, description: string) =>
                    await this.spendPoints(amount, source, description),
                isItemOwned: async (itemId: string) => await this.isItemOwned(itemId)
            };
        }
    }

    /**
     * Expose the points system to React games
     * @returns Object with points system methods
     */
    public static getAPIForReactGames() {
        return {
            getPoints: async () => await this.getPoints(),
            addPoints: async (amount: number, source: string, description: string) =>
                await this.addPoints(amount, source, description),
            spendPoints: async (amount: number, source: string, description: string) =>
                await this.spendPoints(amount, source, description),
            isItemOwned: async (itemId: string) => await this.isItemOwned(itemId)
        };
    }

    // PRIVATE METHODS

    /**
     * Record a transaction
     * @param transaction Transaction to record
     */
    private static async recordTransaction(transaction: PointsTransaction): Promise<void> {
        try {
            // Load existing transactions
            if (this.cachedTransactions === null) {
                const storedTransactions = localStorage.getItem(this.TRANSACTIONS_KEY);
                this.cachedTransactions = storedTransactions ? JSON.parse(storedTransactions) : [];
            }

            // Add null check and ensure cachedTransactions is initialized
            if (!this.cachedTransactions) {
                this.cachedTransactions = [];
            }

            // Add new transaction
            this.cachedTransactions.push(transaction);

            // Limit the number of stored transactions (keep last 100)
            if (this.cachedTransactions.length > 100) {
                this.cachedTransactions = this.cachedTransactions.slice(
                    this.cachedTransactions.length - 100
                );
            }

            // Save to storage
            localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(this.cachedTransactions));
        } catch (error) {
            console.error('Failed to record transaction:', error);
        }
    }

    /**
     * Add a purchased item to the user's collection
     * @param itemId ID of the purchased item
     */
    private static async addPurchasedItem(itemId: string): Promise<void> {
        try {
            // Load existing purchased items
            if (this.cachedPurchasedItems === null) {
                const storedItems = localStorage.getItem(this.PURCHASED_ITEMS_KEY);
                this.cachedPurchasedItems = storedItems ? JSON.parse(storedItems) : [];
            }

            // Add null check and ensure cachedPurchasedItems is initialized
            if (!this.cachedPurchasedItems) {
                this.cachedPurchasedItems = [];
            }

            // Add new item if not already owned
            if (!this.cachedPurchasedItems.includes(itemId)) {
                this.cachedPurchasedItems.push(itemId);

                // Save to storage
                localStorage.setItem(
                    this.PURCHASED_ITEMS_KEY,
                    JSON.stringify(this.cachedPurchasedItems)
                );
            }
        } catch (error) {
            console.error('Failed to add purchased item:', error);
        }
    }

    /**
     * Generate a unique transaction ID
     * @returns string Unique ID
     */
    private static generateTransactionId(): string {
        return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Clear the cache to force reload from storage
     */
    public static clearCache(): void {
        this.cachedPoints = null;
        this.cachedTransactions = null;
        this.cachedPurchasedItems = null;
    }
}

// Make sure to import these services in your actual implementation
import { ServerProgressionService } from './ServerProgressionService';
import { InventoryService } from './InventoryService';
import { ShopService } from './ShopService';

export default PointsService;