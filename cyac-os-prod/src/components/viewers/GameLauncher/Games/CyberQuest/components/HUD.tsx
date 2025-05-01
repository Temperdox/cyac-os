import React, { useState, useEffect } from 'react';
import styles from './HUD.module.css';
import { PlayerData, Level } from '../types';

interface HUDProps {
    playerData: PlayerData;
    level: Level;
    onBack: () => void;
}

const HUD: React.FC<HUDProps> = ({ playerData, level, onBack }) => {
    const [expanded, setExpanded] = useState<boolean>(false);
    const [inventoryExpanded, setInventoryExpanded] = useState<boolean>(false);
    const [activePowerups, setActivePowerups] = useState<{ id: string; name: string; timeLeft: number }[]>([]);

    // Toggle HUD expanded state
    const toggleExpanded = () => {
        setExpanded(prev => !prev);
        if (expanded && inventoryExpanded) {
            setInventoryExpanded(false);
        }
    };

    // Toggle inventory expanded state
    const toggleInventory = (e: React.MouseEvent) => {
        e.stopPropagation();
        setInventoryExpanded(prev => !prev);
    };

    // Simulate active powerups (in a real game, these would come from the game state)
    useEffect(() => {
        // For demo purposes, let's simulate a single powerup
        if (playerData.inventory.length > 0 && playerData.inventory.some(item => item.type === 'powerup')) {
            const powerup = playerData.inventory.find(item => item.type === 'powerup');
            if (powerup) {
                setActivePowerups([
                    {
                        id: powerup.id,
                        name: powerup.name,
                        timeLeft: 30 // 30 seconds remaining
                    }
                ]);

                // Simulate countdown timer
                const timer = setInterval(() => {
                    setActivePowerups(prev =>
                        prev.map(p => ({
                            ...p,
                            timeLeft: p.timeLeft - 1
                        })).filter(p => p.timeLeft > 0)
                    );
                }, 1000);

                return () => clearInterval(timer);
            }
        }
    }, [playerData.inventory]);

    return (
        <div className={`${styles.hud} ${expanded ? styles.expanded : ''}`}>
            <div className={styles.hudMain} onClick={toggleExpanded}>
                <div className={styles.hudTop}>
                    <div className={styles.playerInfo}>
                        <div className={styles.playerName}>{playerData.username}</div>
                        <div className={styles.playerLevel}>LVL {playerData.level}</div>
                    </div>

                    <div className={styles.points}>
                        <span className={styles.pointsValue}>{playerData.points}</span>
                        <span className={styles.pointsLabel}>cR</span>
                    </div>

                    <button className={styles.backButton} onClick={onBack}>
                        Exit
                    </button>
                </div>

                {expanded && (
                    <div className={styles.hudExtended}>
                        <div className={styles.levelInfo}>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Mission:</span>
                                <span className={styles.infoValue}>{level.name}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Type:</span>
                                <span className={styles.infoValue}>{level.type}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Difficulty:</span>
                                <span className={`${styles.infoValue} ${styles[level.difficulty]}`}>
                  {level.difficulty.toUpperCase()}
                </span>
                            </div>
                        </div>

                        <div className={styles.inventorySection}>
                            <div
                                className={styles.inventoryHeader}
                                onClick={toggleInventory}
                            >
                                <span>Inventory ({playerData.inventory.length})</span>
                                <span className={styles.arrow}>
                  {inventoryExpanded ? '▼' : '▶'}
                </span>
                            </div>

                            {inventoryExpanded && playerData.inventory.length > 0 && (
                                <div className={styles.inventoryItems}>
                                    {playerData.inventory.map(item => (
                                        <div key={item.id} className={styles.inventoryItem}>
                                            <div className={`${styles.itemIcon} ${styles[item.type]}`}>
                                                {getItemIcon(item.type)}
                                            </div>
                                            <div className={styles.itemInfo}>
                                                <div className={styles.itemName}>{item.name}</div>
                                                <div className={`${styles.itemRarity} ${styles[item.rarity]}`}>
                                                    {item.rarity}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {inventoryExpanded && playerData.inventory.length === 0 && (
                                <div className={styles.emptyInventory}>
                                    No items in inventory
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Active powerups display */}
            {activePowerups.length > 0 && (
                <div className={styles.powerups}>
                    {activePowerups.map(powerup => (
                        <div key={powerup.id} className={styles.powerup}>
                            <div className={styles.powerupIcon}>⚡</div>
                            <div className={styles.powerupInfo}>
                                <div className={styles.powerupName}>{powerup.name}</div>
                                <div className={styles.powerupTimer}>{powerup.timeLeft}s</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Helper function to get icon for item type
const getItemIcon = (type: string): string => {
    switch (type) {
        case 'tool': return '🔧';
        case 'upgrade': return '⬆️';
        case 'powerup': return '⚡';
        case 'cosmetic': return '✨';
        default: return '📦';
    }
};

export default HUD;