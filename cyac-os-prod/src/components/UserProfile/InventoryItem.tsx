import React from 'react';
import styles from './InventoryItem.module.css';

interface InventoryItemProps {
    item: {
        id: string;
        name: string;
        description: string;
        image: string;
        game: string;
        type: string;
        rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
        quantity: number;
        metadata?: any;
    };
    onClick?: () => void;
}

const InventoryItem: React.FC<InventoryItemProps> = ({ item, onClick }) => {
    return (
        <div
            className={`${styles.item} ${styles[item.rarity]}`}
            onClick={onClick}
        >
            <div className={styles.itemContent}>
                <div className={styles.imageContainer}>
                    <img
                        src={item.image}
                        alt={item.name}
                        className={styles.itemImage}
                    />
                    {item.quantity > 1 && (
                        <div className={styles.quantity}>×{item.quantity}</div>
                    )}
                </div>

                <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemType}>{item.type}</div>
                </div>
            </div>

            <div className={styles.hoverInfo}>
                <div className={styles.itemDescription}>{item.description}</div>
                <div className={styles.viewDetails}>VIEW DETAILS</div>
            </div>
        </div>
    );
};

export default InventoryItem;