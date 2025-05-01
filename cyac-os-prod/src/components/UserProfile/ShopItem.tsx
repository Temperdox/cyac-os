import React from 'react';
import styles from './ShopItem.module.css';

interface ShopItemProps {
    item: {
        id: string;
        name: string;
        description: string;
        image: string;
        category: 'role' | 'theme' | 'item' | 'avatar' | 'banner';
        price: number;
        discountPercent?: number;
        game?: string;
        metadata?: any;
        isOwned?: boolean;
        isNew?: boolean;
        isFeatured?: boolean;
    };
    onPurchase: (item: any) => void;
    userPoints: number;
}

const ShopItem: React.FC<ShopItemProps> = ({ item, onPurchase, userPoints }) => {
    // Calculate discounted price if applicable
    const getDiscountedPrice = (): number => {
        if (item.discountPercent) {
            return Math.floor(item.price * (1 - item.discountPercent / 100));
        }
        return item.price;
    };

    // Check if user can afford this item
    const canAfford = (): boolean => {
        return userPoints >= getDiscountedPrice();
    };

    // Format game name if needed
    const formatGameName = (gameId?: string): string => {
        if (!gameId) return '';

        return gameId.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    // Get rarity class if applicable
    const getRarityClass = (): string => {
        const rarity = item.metadata?.rarity;
        if (!rarity) return '';

        return styles[rarity] || '';
    };

    // Handle purchase button click
    const handlePurchase = () => {
        onPurchase(item);
    };

    return (
        <div className={`${styles.shopItem} ${item.isOwned ? styles.owned : ''} ${getRarityClass()}`}>
            {/* New tag */}
            {item.isNew && !item.isOwned && (
                <div className={styles.newTag}>NEW</div>
            )}

            {/* Featured tag */}
            {item.isFeatured && !item.isOwned && (
                <div className={styles.featuredTag}>FEATURED</div>
            )}

            {/* Discount tag */}
            {item.discountPercent && !item.isOwned && (
                <div className={styles.discountTag}>-{item.discountPercent}%</div>
            )}

            {/* Owned overlay */}
            {item.isOwned && (
                <div className={styles.ownedOverlay}>
                    <div className={styles.ownedText}>OWNED</div>
                </div>
            )}

            {/* Item image */}
            <div className={styles.itemImageContainer}>
                <img
                    src={item.image}
                    alt={item.name}
                    className={styles.itemImage}
                />
            </div>

            {/* Item details */}
            <div className={styles.itemDetails}>
                <h3 className={styles.itemName}>{item.name}</h3>

                {/* Item category / game */}
                <div className={styles.itemMeta}>
          <span className={styles.itemCategory}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </span>
                    {item.game && (
                        <span className={styles.itemGame}>{formatGameName(item.game)}</span>
                    )}
                </div>

                {/* Rarity tag */}
                {item.metadata?.rarity && (
                    <div className={`${styles.rarityTag} ${styles[item.metadata.rarity]}`}>
                        {item.metadata.rarity.toUpperCase()}
                    </div>
                )}

                {/* Item description */}
                <p className={styles.itemDescription}>{item.description}</p>

                {/* Price display */}
                <div className={styles.priceSection}>
                    {item.discountPercent ? (
                        <div className={styles.discountedPrice}>
                            <span className={styles.originalPrice}>{item.price}</span>
                            <span className={styles.finalPrice}>{getDiscountedPrice()}</span>
                            <span className={styles.pointsLabel}>cR</span>
                        </div>
                    ) : (
                        <div className={styles.price}>
                            <span className={styles.priceAmount}>{item.price}</span>
                            <span className={styles.pointsLabel}>cR</span>
                        </div>
                    )}

                    {/* Purchase button */}
                    {!item.isOwned && (
                        <button
                            className={`${styles.purchaseButton} ${!canAfford() ? styles.cantAfford : ''}`}
                            onClick={handlePurchase}
                            disabled={!canAfford()}
                            title={!canAfford() ? 'Not enough points' : 'Purchase'}
                        >
                            {canAfford() ? 'BUY' : 'NEED MORE'}
                        </button>
                    )}

                    {/* Equip/Use button for owned items */}
                    {item.isOwned && (
                        <button className={styles.useButton}>
                            {item.category === 'theme' || item.category === 'avatar' || item.category === 'banner'
                                ? 'EQUIP'
                                : 'USE'}
                        </button>
                    )}
                </div>
            </div>

            {/* Hover effect with details */}
            <div className={styles.hoverDetails}>
                <h3 className={styles.hoverItemName}>{item.name}</h3>
                <p className={styles.hoverDescription}>{item.description}</p>

                {/* Metadata if available */}
                {item.metadata && item.metadata.stats && (
                    <div className={styles.statsContainer}>
                        <div className={styles.statsHeader}>STATS</div>
                        <div className={styles.statsList}>
                            {Object.entries(item.metadata.stats).map(([key, value]) => (
                                <div key={key} className={styles.statItem}>
                  <span className={styles.statName}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                  </span>
                                    <span className={styles.statValue}>{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Buy button on hover */}
                {!item.isOwned ? (
                    <button
                        className={`${styles.hoverButton} ${!canAfford() ? styles.cantAfford : ''}`}
                        onClick={handlePurchase}
                        disabled={!canAfford()}
                    >
                        {canAfford() ? `BUY FOR ${getDiscountedPrice()} PTS` : 'NOT ENOUGH POINTS'}
                    </button>
                ) : (
                    <button className={styles.hoverButton}>
                        {item.category === 'theme' || item.category === 'avatar' || item.category === 'banner'
                            ? 'EQUIP ITEM'
                            : 'USE ITEM'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ShopItem;