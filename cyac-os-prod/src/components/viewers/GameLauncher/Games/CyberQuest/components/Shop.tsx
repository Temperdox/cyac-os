import React, { useState, useEffect } from 'react';
import styles from './Shop.module.css';
import { PlayerData, ShopItem } from '../types';

interface ShopProps {
    items: ShopItem[];
    playerData: PlayerData;
    onPurchase: (item: ShopItem) => Promise<boolean>;
    onBack: () => void;
}

const Shop: React.FC<ShopProps> = ({
                                       items,
                                       playerData,
                                       onPurchase,
                                       onBack
                                   }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [filteredItems, setFilteredItems] = useState<ShopItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Get unique categories from items
    const categories = ['all', ...new Set(items.map(item => item.category || item.type))];

    // Filter items based on selected category
    useEffect(() => {
        let filtered = [...items];

        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(item =>
                (item.category === selectedCategory) || (item.type === selectedCategory)
            );
        }

        // Filter out items the player already owns
        // For consumables, only filter if quantity is 0
        filtered = filtered.filter(item => {
            const ownedItem = playerData.inventory.find(i => i.id === item.id);
            if (!ownedItem) return true;

            // If item is consumable, show if player has none left
            if (item.consumable) {
                return ownedItem.quantity === 0;
            }

            // For non-consumables, don't show if already owned
            return false;
        });

        setFilteredItems(filtered);
    }, [items, selectedCategory, playerData.inventory]);

    // Handle item selection
    const handleSelectItem = (item: ShopItem) => {
        setSelectedItem(item);
        // Reset purchase status when selecting a new item
        setPurchaseStatus('idle');
        setErrorMessage('');
    };

    // Handle purchase
    const handlePurchase = async () => {
        if (!selectedItem) return;

        // Check if player has enough points
        if (playerData.points < selectedItem.price) {
            setPurchaseStatus('error');
            setErrorMessage('Not enough cR to purchase this item');
            return;
        }

        setPurchaseStatus('processing');

        try {
            const success = await onPurchase(selectedItem);

            if (success) {
                setPurchaseStatus('success');
            } else {
                setPurchaseStatus('error');
                setErrorMessage('Failed to purchase item');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            setPurchaseStatus('error');
            setErrorMessage('An unexpected error occurred');
        }
    };

    // Get an appropriate icon for each item type
    const getItemTypeIcon = (type: string): string => {
        switch (type) {
            case 'tool': return '🔧';
            case 'upgrade': return '⬆️';
            case 'powerup': return '⚡';
            case 'cosmetic': return '✨';
            default: return '📦';
        }
    };

    // Get color class for rarity
    const getRarityClass = (rarity: string): string => {
        return styles[rarity] || '';
    };

    return (
        <div className={styles.shopContainer}>
            <div className={styles.shopHeader}>
                <h2 className={styles.shopTitle}>CYBER MARKET</h2>
                <div className={styles.playerPoints}>
                    <span className={styles.pointsValue}>{playerData.points}</span>
                    <span className={styles.pointsLabel}>cR</span>
                </div>
                <button className={styles.backButton} onClick={onBack}>
                    Back
                </button>
            </div>

            <div className={styles.shopContent}>
                <div className={styles.categoriesSidebar}>
                    <h3 className={styles.categoriesTitle}>Categories</h3>
                    <div className={styles.categoriesList}>
                        {categories.map(category => (
                            <button
                                key={category}
                                className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''}`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.itemsGrid}>
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <div
                                key={item.id}
                                className={`${styles.itemCard} ${selectedItem?.id === item.id ? styles.selected : ''}`}
                                onClick={() => handleSelectItem(item)}
                            >
                                <div className={`${styles.itemRarity} ${getRarityClass(item.rarity)}`}></div>
                                <div className={styles.itemIcon}>
                                    {getItemTypeIcon(item.type)}
                                </div>
                                <div className={styles.itemInfo}>
                                    <h3 className={styles.itemName}>{item.name}</h3>
                                    <div className={styles.itemType}>
                                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                        {item.consumable && ' (Consumable)'}
                                    </div>
                                    <div className={styles.itemPrice}>
                                        {item.price} cR
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.noItems}>
                            No items available in this category or you already own all items.
                        </div>
                    )}
                </div>

                {selectedItem && (
                    <div className={styles.itemDetail}>
                        <h3 className={styles.detailTitle}>{selectedItem.name}</h3>
                        <div className={`${styles.detailRarity} ${getRarityClass(selectedItem.rarity)}`}>
                            {selectedItem.rarity.charAt(0).toUpperCase() + selectedItem.rarity.slice(1)}
                        </div>
                        <p className={styles.detailDescription}>{selectedItem.description}</p>

                        <div className={styles.detailEffects}>
                            <h4>Effects:</h4>
                            <ul className={styles.effectsList}>
                                {selectedItem.effects.map((effect, index) => (
                                    <li key={index} className={styles.effectItem}>
                                        {getEffectDescription(effect)}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {selectedItem.consumable && (
                            <div className={styles.detailQuantity}>
                                Quantity: {selectedItem.quantity || 1}
                            </div>
                        )}

                        <div className={styles.purchaseSection}>
                            <div className={styles.detailPrice}>
                                Price: <span className={styles.priceValue}>{selectedItem.price}</span> cR
                            </div>

                            <button
                                className={styles.purchaseButton}
                                onClick={handlePurchase}
                                disabled={purchaseStatus === 'processing' || purchaseStatus === 'success' || playerData.points < selectedItem.price}
                            >
                                {purchaseStatus === 'processing' ? 'Processing...' :
                                    purchaseStatus === 'success' ? 'Purchased!' :
                                        'Purchase'}
                            </button>
                        </div>

                        {purchaseStatus === 'error' && (
                            <div className={styles.errorMessage}>
                                {errorMessage || 'Failed to purchase item'}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper function to create user-friendly descriptions of effects
const getEffectDescription = (effect: any): string => {
    switch (effect.type) {
        case 'speed_boost':
            return `Increases hacking speed by ${(effect.value - 1) * 100}%`;
        case 'time_slow':
            return `Slows down time by ${(1 - effect.value) * 100}%${effect.duration ? ` for ${effect.duration} seconds` : ''}`;
        case 'score_multiplier':
            return `Increases points earned by ${(effect.value - 1) * 100}%`;
        case 'hint':
            return 'Provides occasional hints during challenges';
        case 'reveal_path':
            return `Reveals hidden ${effect.value.replace('_', ' ')}`;
        case 'auto_solve':
            return `Automatically solves ${effect.value.replace('_', ' ')} puzzles`;
        case 'puzzle_difficulty':
            return `${effect.modifier < 0 ? 'Decreases' : 'Increases'} difficulty of ${effect.value} puzzles`;
        case 'collect_radius':
            return `Collects items within ${effect.value} cells${effect.duration ? ` for ${effect.duration} seconds` : ''}`;
        case 'custom':
            return effect.value.split('_').map((word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        default:
            return `${effect.type}: ${effect.value}`;
    }
};

export default Shop;