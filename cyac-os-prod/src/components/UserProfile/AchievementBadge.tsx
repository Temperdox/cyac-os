import React from 'react';
import styles from './AchievementBadge.module.css';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    game: string;
    unlocked: boolean;
    unlockedAt?: Date;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

interface AchievementBadgeProps {
    achievement: Achievement;
    onClick?: () => void;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement, onClick }) => {
    return (
        <div
            className={`${styles.badge} ${achievement.unlocked ? '' : styles.locked} ${styles[achievement.rarity]}`}
            onClick={onClick}
        >
            <div className={styles.badgeContent}>
                <img
                    src={achievement.icon}
                    alt={achievement.title}
                    className={styles.badgeIcon}
                />
                <div className={`${styles.badgeInfo} ${achievement.unlocked ? '' : styles.lockedInfo}`}>
                    <div className={styles.badgeTitle}>{achievement.title}</div>
                    <div className={styles.badgeRarity}>{achievement.rarity.toUpperCase()}</div>
                </div>
            </div>

            {!achievement.unlocked && (
                <div className={styles.lockedOverlay}>
                    <div className={styles.lockIcon}>🔒</div>
                </div>
            )}
        </div>
    );
};

export default AchievementBadge;