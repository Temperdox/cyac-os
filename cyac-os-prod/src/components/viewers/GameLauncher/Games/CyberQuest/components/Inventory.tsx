import React, { useState, useEffect } from 'react';
import styles from './Inventory.module.css';
import { PlayerData, InventoryItem } from '../types';

interface InventoryProps {
    playerData: PlayerData;
    onBack: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ playerData, onBack }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Get unique categories from inventory items
    const categories = ['all', ...new Set(playerData.inventory.map(item => item.type))];

    // Filter items based on selected category and search query
    useEffect(() => {
        let filtered = [...playerData.inventory];

        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(item => item.type === selectedCategory);
        }

        // Apply search filter
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query)
            );
        }

        setFilteredItems(filtered);
    }, [playerData.inventory, selectedCategory, searchQuery]);

    // Handle item selection
    const handleSelectItem = (item: InventoryItem) => {
        setSelectedItem(item);
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

    // Format acquisition date
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.inventoryContainer}>
            <div className={styles.inventoryHeader}>
                <h2 className={styles.inventoryTitle}>INVENTORY</h2>
                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && (
                        <button
                            className={styles.clearButton}
                            onClick={() => setSearchQuery('')}
                        >
                            ✕
                        </button>
                    )}
                </div>
                <button className={styles.backButton} onClick={onBack}>
                    Back
                </button>
            </div>

            <div className={styles.inventoryContent}>
                <div className={styles.categoriesSidebar}>
                    <h3 className={styles.categoriesTitle}>Categories</h3>
                    <div className={styles.categoriesList}>
                        {categories.map(category => (
                            <button
                                key={category}
                                className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''}`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category === 'all' ? 'All Items' :
                                    category.charAt(0).toUpperCase() + category.slice(1) + 's'}
                                <span className={styles.categoryCount}>
                  {category === 'all'
                      ? playerData.inventory.length
                      : playerData.inventory.filter(item => item.type === category).length}
                </span>
                            </button>
                        ))}
                    </div>

                    <div className={styles.playerStats}>
                        <h3 className={styles.statsTitle}>Player Stats</h3>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Level:</span>
                            <span className={styles.statValue}>{playerData.level}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Experience:</span>
                            <span className={styles.statValue}>{playerData.experience}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Credits:</span>
                            <span className={`${styles.statValue} ${styles.credits}`}>{playerData.points} cR</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Completed Levels:</span>
                            <span className={styles.statValue}>{playerData.completedLevels.length}</span>
                        </div>
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
                                    </div>
                                    {item.quantity !== undefined && (
                                        <div className={styles.itemQuantity}>
                                            Quantity: {item.quantity}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.noItems}>
                            {searchQuery
                                ? 'No items match your search.'
                                : selectedCategory === 'all'
                                    ? 'Your inventory is empty.'
                                    : `You don't have any ${selectedCategory} items.`}
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

                        {selectedItem.quantity !== undefined && (
                            <div className={styles.detailQuantity}>
                                Quantity: {selectedItem.quantity}
                            </div>
                        )}

                        <div className={styles.acquisitionInfo}>
                            <div className={styles.acquisitionDate}>
                                Acquired: {formatDate(selectedItem.acquired)}
                            </div>
                        </div>

                        {selectedItem.type === 'powerup' && selectedItem.quantity && selectedItem.quantity > 0 && (
                            <button className={styles.useButton}>
                                Use Item
                            </button>
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

export default Inventory;