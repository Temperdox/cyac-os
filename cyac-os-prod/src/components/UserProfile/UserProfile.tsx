import React, { useState, useEffect, useRef } from 'react';
import styles from './UserProfile.module.css';
import { DiscordAuthService } from '../../services/DiscordAuthService';
import { AchievementService } from '../../services/AchievementService';
import { InventoryService } from '../../services/InventoryService';
import { ServerProgressionService } from '../../services/ServerProgressionService';
import InventoryItem from './InventoryItem';
import AchievementBadge from './AchievementBadge';
import RoleTag from './RoleTag';
import ProgressBar from './ProgressBar';

// Type definitions
interface UserProfileProps {
    isOpen: boolean;
    onClose: () => void;
    isMobile?: boolean;
}

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

interface UserRole {
    id: string;
    name: string;
    color: string;
    icon?: string;
    priority: number;
}

interface ServerProgression {
    level: number;
    currentXP: number;
    nextLevelXP: number;
    roles: UserRole[];
    milestones: {
        level: number;
        reward: string;
        unlocked: boolean;
    }[];
}

const UserProfile: React.FC<UserProfileProps> = ({
                                                     isOpen,
                                                     onClose,
                                                     isMobile = false
                                                 }) => {
    // State hooks
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'inventory' | 'server'>('overview');
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [serverProgression, setServerProgression] = useState<ServerProgression | null>(null);
    const [gameFilter, setGameFilter] = useState<string>('all');
    const [availableGames, setAvailableGames] = useState<{id: string, name: string}[]>([]);
    const [inventoryFilter, setInventoryFilter] = useState<string>('all');
    const [activeAchievement, setActiveAchievement] = useState<Achievement | null>(null);
    const [activeInventoryItem, setActiveInventoryItem] = useState<InventoryItem | null>(null);

    // Refs for 3D effects
    const profileContainerRef = useRef<HTMLDivElement>(null);
    const avatarContainerRef = useRef<HTMLDivElement>(null);

    // Load user data when component mounts
    useEffect(() => {
        if (isOpen) {
            const userData = DiscordAuthService.getCurrentUser();
            setUser(userData);

            // Fetch user achievements, inventory, and server progression
            loadUserData().then(r => console.log('User data loaded:', r));
        }
    }, [isOpen]);

    // Apply 3D effect on mouse move
    useEffect(() => {
        if (!isOpen || isMobile) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!profileContainerRef.current || !avatarContainerRef.current) return;

            // Calculate 3D effect for profile container
            const profileRect = profileContainerRef.current.getBoundingClientRect();
            const profileX = (e.clientX - profileRect.left) / profileRect.width - 0.5;
            const profileY = (e.clientY - profileRect.top) / profileRect.height - 0.5;

            // Apply subtle rotation to profile container
            profileContainerRef.current.style.transform =
                `perspective(1000px) rotateX(${profileY * -3}deg) rotateY(${profileX * 3}deg)`;

            // Apply stronger effect to avatar
            avatarContainerRef.current.style.transform =
                `translateZ(20px) rotateX(${profileY * -8}deg) rotateY(${profileX * 8}deg)`;
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);

            // Reset transforms when unmounting
            if (profileContainerRef.current) {
                profileContainerRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
            }

            if (avatarContainerRef.current) {
                avatarContainerRef.current.style.transform = 'translateZ(0) rotateX(0deg) rotateY(0deg)';
            }
        };
    }, [isOpen, isMobile]);

    // Function to load all user data
    const loadUserData = async () => {
        try {
            // Load achievements
            const achievementsData = await AchievementService.getUserAchievements();
            setAchievements(achievementsData);

            // Load inventory
            const inventoryData = await InventoryService.getUserInventory();
            setInventory(inventoryData);

            // Load server progression
            const progressionData = await ServerProgressionService.getUserProgression();
            setServerProgression(progressionData);

            // Extract available games from achievements and inventory
            const gamesFromAchievements = achievementsData.map((a: { game: any; }) => a.game);
            const gamesFromInventory = inventoryData.map((i: { game: any; }) => i.game);

            // Combine and remove duplicates
            const allGames = [...new Set([...gamesFromAchievements, ...gamesFromInventory])];
            setAvailableGames(allGames.map(g => ({ id: g, name: formatGameName(g) })));

        } catch (error) {
            console.error("Error loading user data:", error);
        }
    };

    // Helper to format game IDs into readable names
    const formatGameName = (gameId: string): string => {
        return gameId.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    // Filter achievements by game
    const filteredAchievements = achievements.filter(achievement =>
        gameFilter === 'all' || achievement.game === gameFilter
    );

    // Filter inventory by game and type
    const filteredInventory = inventory.filter(item =>
        (gameFilter === 'all' || item.game === gameFilter) &&
        (inventoryFilter === 'all' || item.type === inventoryFilter)
    );

    // Get inventory types for filter dropdown
    const inventoryTypes = [...new Set(inventory.map(item => item.type))];

    // Calculate achievement statistics
    const achievementStats = {
        total: achievements.length,
        unlocked: achievements.filter(a => a.unlocked).length,
        percentage: achievements.length > 0
            ? Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)
            : 0
    };

    // Generate avatar URL
    const getAvatarUrl = () => {
        if (!user || !user.avatar) {
            return 'https://cdn.discordapp.com/embed/avatars/0.png';
        }
        return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
    };

    // Get banner URL
    const getBannerUrl = () => {
        if (!user || !user.banner) {
            return null;
        }
        return `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png?size=600`;
    };

    // Get user roles sorted by priority
    const sortedRoles = serverProgression?.roles.sort((a, b) => b.priority - a.priority) || [];

    // If profile is not open, don't render anything
    if (!isOpen) return null;

    return (
        <div className={`${styles.profileBackdrop} ${isMobile ? styles.mobile : ''}`}>
            <div
                className={styles.profileContainer}
                ref={profileContainerRef}
            >
                {/* Header with close button */}
                <div className={styles.profileHeader}>
                    <h2 className={styles.profileTitle}>USER PROFILE</h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close profile"
                    >
                        <span>×</span>
                    </button>
                </div>

                {/* User info section with 3D avatar */}
                <div className={styles.userInfoSection}>
                    {/* Banner background */}
                    {getBannerUrl() && (
                        <div
                            className={styles.profileBanner}
                            style={{ backgroundImage: `url(${getBannerUrl()})` }}
                        >
                            <div className={styles.bannerOverlay}></div>
                        </div>
                    )}

                    {/* User avatar with 3D effect */}
                    <div className={styles.avatarSection}>
                        <div
                            className={styles.avatarContainer}
                            ref={avatarContainerRef}
                        >
                            <img
                                src={getAvatarUrl()}
                                alt={user?.username || 'User'}
                                className={styles.userAvatar}
                            />

                            {/* Achievement badges overlay on avatar */}
                            <div className={styles.avatarBadges}>
                                {achievements
                                    .filter(a => a.unlocked)
                                    .slice(0, 3)
                                    .map((achievement, index) => (
                                        <div
                                            key={achievement.id}
                                            className={`${styles.avatarBadge} ${styles[`position${index}`]}`}
                                            title={achievement.title}
                                        >
                                            <img src={achievement.icon} alt={achievement.title} />
                                        </div>
                                    ))
                                }
                            </div>
                        </div>

                        <div className={styles.userInfo}>
                            <h3 className={styles.userName}>{user?.username || 'User'}</h3>
                            <div className={styles.userStats}>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>LEVEL</span>
                                    <span className={styles.statValue}>{serverProgression?.level || 0}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>ACHIEVEMENTS</span>
                                    <span className={styles.statValue}>
                    {achievementStats.unlocked}/{achievementStats.total}
                  </span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>ITEMS</span>
                                    <span className={styles.statValue}>{inventory.length}</span>
                                </div>
                            </div>

                            {/* XP Progress bar */}
                            {serverProgression && (
                                <div className={styles.progressBarContainer}>
                                    <ProgressBar
                                        current={serverProgression.currentXP}
                                        max={serverProgression.nextLevelXP}
                                        showLabel={true}
                                        label={`XP: ${serverProgression.currentXP}/${serverProgression.nextLevelXP}`}
                                    />
                                </div>
                            )}

                            {/* Role tags */}
                            <div className={styles.roleTagsContainer}>
                                {sortedRoles.slice(0, 4).map(role => (
                                    <RoleTag
                                        key={role.id}
                                        name={role.name}
                                        color={role.color}
                                        icon={role.icon}
                                    />
                                ))}
                                {sortedRoles.length > 4 && (
                                    <div className={styles.moreRoles}>+{sortedRoles.length - 4} more</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab navigation */}
                <div className={styles.tabsContainer}>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'overview' ? styles.active : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        OVERVIEW
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'achievements' ? styles.active : ''}`}
                        onClick={() => setActiveTab('achievements')}
                    >
                        ACHIEVEMENTS
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'inventory' ? styles.active : ''}`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        INVENTORY
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'server' ? styles.active : ''}`}
                        onClick={() => setActiveTab('server')}
                    >
                        SERVER
                    </button>
                </div>

                {/* Tab content */}
                <div className={styles.tabContent}>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className={styles.overviewTab}>
                            {/* Recent achievements */}
                            <div className={styles.overviewSection}>
                                <h3 className={styles.sectionTitle}>RECENT ACHIEVEMENTS</h3>
                                <div className={styles.recentAchievements}>
                                    {achievements
                                        .filter(a => a.unlocked)
                                        .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
                                        .slice(0, 4)
                                        .map(achievement => (
                                            <AchievementBadge
                                                key={achievement.id}
                                                achievement={achievement}
                                                onClick={() => setActiveAchievement(achievement)}
                                            />
                                        ))}
                                    {achievements.filter(a => a.unlocked).length === 0 && (
                                        <div className={styles.emptyState}>No achievements unlocked yet</div>
                                    )}
                                </div>
                            </div>

                            {/* Progression overview */}
                            <div className={styles.overviewSection}>
                                <h3 className={styles.sectionTitle}>SERVER PROGRESSION</h3>
                                {serverProgression ? (
                                    <div className={styles.progressionOverview}>
                                        <div className={styles.levelDisplay}>
                                            <div className={styles.levelCircle}>{serverProgression.level}</div>
                                            <div className={styles.levelLabel}>LEVEL</div>
                                        </div>

                                        <div className={styles.progressDetails}>
                                            <ProgressBar
                                                current={serverProgression.currentXP}
                                                max={serverProgression.nextLevelXP}
                                                showLabel={true}
                                                label={`${serverProgression.currentXP}/${serverProgression.nextLevelXP} XP`}
                                            />

                                            <div className={styles.nextReward}>
                                                {serverProgression.milestones
                                                    .filter(m => !m.unlocked)
                                                    .sort((a, b) => a.level - b.level)[0] ? (
                                                    <div>
                                                        <span className={styles.rewardLabel}>NEXT REWARD AT LEVEL </span>
                                                        <span className={styles.rewardLevel}>
                                {serverProgression.milestones
                                    .filter(m => !m.unlocked)
                                    .sort((a, b) => a.level - b.level)[0].level}
                              </span>
                                                    </div>
                                                ) : (
                                                    <div>All milestone rewards unlocked!</div>
                                                )
                                                }
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.emptyState}>No progression data available</div>
                                )}
                            </div>

                            {/* Recent items */}
                            <div className={styles.overviewSection}>
                                <h3 className={styles.sectionTitle}>RECENT ITEMS</h3>
                                <div className={styles.recentItems}>
                                    {inventory
                                        .slice(0, 4)
                                        .map(item => (
                                            <InventoryItem
                                                key={item.id}
                                                item={item}
                                                onClick={() => setActiveInventoryItem(item)}
                                            />
                                        ))}
                                    {inventory.length === 0 && (
                                        <div className={styles.emptyState}>No items in inventory</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Achievements Tab */}
                    {activeTab === 'achievements' && (
                        <div className={styles.achievementsTab}>
                            {/* Filters and stats */}
                            <div className={styles.achievementHeader}>
                                <div className={styles.achievementStats}>
                                    <div className={styles.achievementPercentage}>
                                        <div
                                            className={styles.percentageBar}
                                            style={{width: `${achievementStats.percentage}%`}}
                                        ></div>
                                        <span className={styles.percentageText}>{achievementStats.percentage}%</span>
                                    </div>
                                    <div className={styles.statText}>
                                        {achievementStats.unlocked}/{achievementStats.total} Achievements
                                    </div>
                                </div>

                                <div className={styles.filterControls}>
                                    <select
                                        className={styles.gameFilter}
                                        value={gameFilter}
                                        onChange={(e) => setGameFilter(e.target.value)}
                                    >
                                        <option value="all">All Games</option>
                                        {availableGames.map(game => (
                                            <option key={game.id} value={game.id}>{game.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Achievement grid */}
                            <div className={styles.achievementGrid}>
                                {filteredAchievements.length > 0 ? (
                                    filteredAchievements.map(achievement => (
                                        <AchievementBadge
                                            key={achievement.id}
                                            achievement={achievement}
                                            onClick={() => setActiveAchievement(achievement)}
                                        />
                                    ))
                                ) : (
                                    <div className={styles.emptyState}>No achievements for the selected game</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Inventory Tab */}
                    {activeTab === 'inventory' && (
                        <div className={styles.inventoryTab}>
                            {/* Filters */}
                            <div className={styles.inventoryHeader}>
                                <div className={styles.filterControls}>
                                    <select
                                        className={styles.gameFilter}
                                        value={gameFilter}
                                        onChange={(e) => setGameFilter(e.target.value)}
                                    >
                                        <option value="all">All Games</option>
                                        {availableGames.map(game => (
                                            <option key={game.id} value={game.id}>{game.name}</option>
                                        ))}
                                    </select>

                                    <select
                                        className={styles.typeFilter}
                                        value={inventoryFilter}
                                        onChange={(e) => setInventoryFilter(e.target.value)}
                                    >
                                        <option value="all">All Types</option>
                                        {inventoryTypes.map(type => (
                                            <option key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.inventoryCount}>
                                    {filteredInventory.length} item{filteredInventory.length !== 1 ? 's' : ''}
                                </div>
                            </div>

                            {/* Inventory grid */}
                            <div className={styles.inventoryGrid}>
                                {filteredInventory.length > 0 ? (
                                    filteredInventory.map(item => (
                                        <InventoryItem
                                            key={item.id}
                                            item={item}
                                            onClick={() => setActiveInventoryItem(item)}
                                        />
                                    ))
                                ) : (
                                    <div className={styles.emptyState}>No items match the selected filters</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Server Tab */}
                    {activeTab === 'server' && (
                        <div className={styles.serverTab}>
                            {serverProgression ? (
                                <>
                                    {/* Level progress section */}
                                    <div className={styles.serverSection}>
                                        <h3 className={styles.sectionTitle}>LEVEL PROGRESS</h3>
                                        <div className={styles.levelProgressionDetails}>
                                            <div className={styles.currentLevelDisplay}>
                                                <div className={styles.bigLevelCircle}>{serverProgression.level}</div>
                                                <div className={styles.serverXPInfo}>
                                                    <div className={styles.xpLabel}>LEVEL {serverProgression.level}</div>
                                                    <ProgressBar
                                                        current={serverProgression.currentXP}
                                                        max={serverProgression.nextLevelXP}
                                                        showLabel={true}
                                                        label={`${serverProgression.currentXP}/${serverProgression.nextLevelXP} XP`}
                                                    />
                                                    <div className={styles.xpToLevel}>
                                                        {serverProgression.nextLevelXP - serverProgression.currentXP} XP to level {serverProgression.level + 1}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Milestones section */}
                                    <div className={styles.serverSection}>
                                        <h3 className={styles.sectionTitle}>MILESTONES</h3>
                                        <div className={styles.milestonesList}>
                                            {serverProgression.milestones
                                                .sort((a, b) => a.level - b.level)
                                                .map((milestone, index) => (
                                                    <div
                                                        key={index}
                                                        className={`${styles.milestoneItem} ${milestone.unlocked ? styles.unlocked : styles.locked}`}
                                                    >
                                                        <div className={styles.milestoneLevel}>
                                                            <div className={styles.levelNumber}>{milestone.level}</div>
                                                        </div>
                                                        <div className={styles.milestoneInfo}>
                                                            <div className={styles.milestoneReward}>{milestone.reward}</div>
                                                            <div className={styles.milestoneStatus}>
                                                                {milestone.unlocked ? 'UNLOCKED' : 'LOCKED'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    {/* Roles section */}
                                    <div className={styles.serverSection}>
                                        <h3 className={styles.sectionTitle}>ROLES</h3>
                                        <div className={styles.rolesList}>
                                            {sortedRoles.map(role => (
                                                <div
                                                    key={role.id}
                                                    className={styles.roleItem}
                                                    style={{borderColor: role.color}}
                                                >
                                                    {role.icon && (
                                                        <div className={styles.roleIcon}>
                                                            <img src={role.icon} alt="" />
                                                        </div>
                                                    )}
                                                    <div
                                                        className={styles.roleName}
                                                        style={{color: role.color}}
                                                    >
                                                        {role.name}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.emptyState}>No server progression data available</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Detail modals for achievements and inventory items */}
                {activeAchievement && (
                    <div className={styles.detailModal}>
                        <div className={styles.detailContent}>
                            <button
                                className={styles.closeModalButton}
                                onClick={() => setActiveAchievement(null)}
                            >
                                <span>×</span>
                            </button>

                            <div className={styles.achievementDetail}>
                                <div className={styles.achievementIcon}>
                                    <img
                                        src={activeAchievement.icon}
                                        alt={activeAchievement.title}
                                        className={`${styles.achievementIconImg} ${styles[activeAchievement.rarity]}`}
                                    />
                                </div>

                                <div className={styles.achievementInfo}>
                                    <h3 className={styles.achievementTitle}>{activeAchievement.title}</h3>
                                    <div className={styles.achievementMeta}>
                    <span className={`${styles.rarityBadge} ${styles[activeAchievement.rarity]}`}>
                      {activeAchievement.rarity.toUpperCase()}
                    </span>
                                        <span className={styles.gameBadge}>
                      {formatGameName(activeAchievement.game)}
                    </span>
                                    </div>
                                    <p className={styles.achievementDescription}>
                                        {activeAchievement.description}
                                    </p>
                                    {activeAchievement.unlocked && activeAchievement.unlockedAt && (
                                        <div className={styles.unlockedDate}>
                                            Unlocked on {activeAchievement.unlockedAt.toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeInventoryItem && (
                    <div className={styles.detailModal}>
                        <div className={styles.detailContent}>
                            <button
                                className={styles.closeModalButton}
                                onClick={() => setActiveInventoryItem(null)}
                            >
                                <span>×</span>
                            </button>

                            <div className={styles.itemDetail}>
                                <div className={styles.itemImageContainer}>
                                    <img
                                        src={activeInventoryItem.image}
                                        alt={activeInventoryItem.name}
                                        className={`${styles.itemImage} ${styles[activeInventoryItem.rarity]}`}
                                    />
                                    {activeInventoryItem.quantity > 1 && (
                                        <div className={styles.itemQuantity}>×{activeInventoryItem.quantity}</div>
                                    )}
                                </div>

                                <div className={styles.itemInfo}>
                                    <h3 className={styles.itemTitle}>{activeInventoryItem.name}</h3>
                                    <div className={styles.itemMeta}>
                    <span className={`${styles.rarityBadge} ${styles[activeInventoryItem.rarity]}`}>
                      {activeInventoryItem.rarity.toUpperCase()}
                    </span>
                                        <span className={styles.typeBadge}>
                      {activeInventoryItem.type.toUpperCase()}
                    </span>
                                        <span className={styles.gameBadge}>
                      {formatGameName(activeInventoryItem.game)}
                    </span>
                                    </div>
                                    <p className={styles.itemDescription}>
                                        {activeInventoryItem.description}
                                    </p>

                                    {/* Render any additional metadata */}
                                    {activeInventoryItem.metadata && (
                                        <div className={styles.itemMetadata}>
                                            {Object.entries(activeInventoryItem.metadata).map(([key, value]) => (
                                                <div key={key} className={styles.metadataItem}>
                                                    <span className={styles.metadataKey}>{key}: </span>
                                                    <span className={styles.metadataValue}>{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;