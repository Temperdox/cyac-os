import React, { useState, useEffect } from 'react';
import styles from './Shop.module.css';
import { ShopService, ShopCategory, ShopSortOption } from '../../services/ShopService';
import { PointsService } from '../../services/PointsService';
import ShopItem from './ShopItem';
import ConfirmationModal from '../Common/ConfirmationModal';

interface ShopProps {
    isMobile?: boolean;
}

const Shop: React.FC<ShopProps> = ({ isMobile = false }) => {
    // State for shop items and filters
    const [shopItems, setShopItems] = useState<any[]>([]);
    const [filteredItems, setFilteredItems] = useState<any[]>([]);
    const [featuredItems, setFeaturedItems] = useState<any[]>([]);
    const [availableGames, setAvailableGames] = useState<{id: string, name: string}[]>([]);
    const [userPoints, setUserPoints] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Filter states
    const [categoryFilter, setCategoryFilter] = useState<ShopCategory>('all');
    const [gameFilter, setGameFilter] = useState<string>('all');
    const [sortOption, setSortOption] = useState<ShopSortOption>('featured');
    const [showOwned, setShowOwned] = useState<boolean>(true);

    // Purchase modal state
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
    const [purchaseResult, setPurchaseResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    // Load shop data on component mount
    useEffect(() => {
        loadShopData();

        // Listen for points changes
        window.addEventListener('pointsChanged', handlePointsChange);
        window.addEventListener('shopUpdated', handleShopUpdate);

        return () => {
            window.removeEventListener('pointsChanged', handlePointsChange);
            window.removeEventListener('shopUpdated', handleShopUpdate);
        };
    }, []);

    // Apply filters when filter states change
    useEffect(() => {
        applyFilters();
    }, [shopItems, categoryFilter, gameFilter, sortOption, showOwned]);

    // Load user points when shop opens
    useEffect(() => {
        const loadPoints = async () => {
            const points = await PointsService.getPoints();
            setUserPoints(points);
        };

        loadPoints();
    }, []);

    // Handler for points change events
    const handlePointsChange = async () => {
        const points = await PointsService.getPoints();
        setUserPoints(points);

        // Refresh items to update ownership status
        loadShopData();
    };

    // Handler for shop update events
    const handleShopUpdate = () => {
        loadShopData();
    };

    // Load shop data
    const loadShopData = async () => {
        setIsLoading(true);

        try {
            // Load all shop items
            const items = await ShopService.getShopItems();
            setShopItems(items);

            // Load featured items for the featured section
            const featured = await ShopService.getFeaturedItems();
            setFeaturedItems(featured);

            // Load available games for the filter
            const games = await ShopService.getShopGameOptions();
            setAvailableGames(games);
        } catch (error) {
            console.error('Failed to load shop data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Apply filters to the shop items
    const applyFilters = async () => {
        try {
            const filtered = await ShopService.getFilteredShopItems(
                categoryFilter,
                gameFilter,
                sortOption,
                showOwned
            );

            setFilteredItems(filtered);
        } catch (error) {
            console.error('Failed to apply filters:', error);
        }
    };

    // Handle purchase request
    const handlePurchaseRequest = (item: any) => {
        setSelectedItem(item);
        setShowConfirmation(true);
        setPurchaseResult(null);
    };

    // Confirm purchase
    const confirmPurchase = async () => {
        if (!selectedItem) return;

        try {
            // Calculate actual price (considering discounts)
            const finalPrice = selectedItem.discountPercent
                ? Math.floor(selectedItem.price * (1 - selectedItem.discountPercent / 100))
                : selectedItem.price;

            // Check if user has enough points
            if (userPoints < finalPrice) {
                setPurchaseResult({
                    success: false,
                    message: `Not enough points. You need ${finalPrice} points.`
                });
                return;
            }

            // Attempt to purchase
            const success = await ShopService.purchaseItem(selectedItem.id);

            if (success) {
                setPurchaseResult({
                    success: true,
                    message: `Successfully purchased ${selectedItem.name}!`
                });

                // Refresh items
                loadShopData();
            } else {
                setPurchaseResult({
                    success: false,
                    message: 'Failed to purchase item. Please try again.'
                });
            }
        } catch (error: any) {
            setPurchaseResult({
                success: false,
                message: error.message || 'An error occurred during purchase.'
            });
        }
    };

    // Close confirmation modal
    const closeConfirmation = () => {
        // If purchase was successful or we're just canceling
        if (!purchaseResult || purchaseResult.success) {
            setShowConfirmation(false);
            setSelectedItem(null);
            setPurchaseResult(null);
        }
    };

    // Format points with commas
    const formatPoints = (points: number): string => {
        return points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Get the category label
    const getCategoryLabel = (category: ShopCategory): string => {
        switch (category) {
            case 'all': return 'All Items';
            case 'role': return 'Roles';
            case 'theme': return 'Themes';
            case 'item': return 'Game Items';
            case 'avatar': return 'Avatars';
            case 'banner': return 'Banners';
            default: return 'All Items';
        }
    };

    // Calculate discounted price
    const getDiscountedPrice = (item: any): number => {
        if (item.discountPercent) {
            return Math.floor(item.price * (1 - item.discountPercent / 100));
        }
        return item.price;
    };

    return (
        <div className={`${styles.shopContainer} ${isMobile ? styles.mobile : ''}`}>
            {/* Header with points display */}
            <div className={styles.shopHeader}>
                <h1 className={styles.shopTitle}>CYBER SHOP</h1>{/*
                <div className={styles.pointsDisplay}>
                    <div className={styles.pointsIcon}>cR</div>
                    <div className={styles.pointsAmount}>{formatPoints(userPoints)}</div>
                </div>*/}
            </div>

            {/* Featured items section */}
            {featuredItems.length > 0 && (
                <div className={styles.featuredSection}>
                    <h2 className={styles.sectionTitle}>FEATURED ITEMS</h2>
                    <div className={styles.featuredGrid}>
                        {featuredItems.map(item => (
                            <ShopItem
                                key={item.id}
                                item={item}
                                onPurchase={handlePurchaseRequest}
                                userPoints={userPoints}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Filters section */}
            <div className={styles.filtersSection}>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>CATEGORY</label>
                    <div className={styles.categoryFilters}>
                        <button
                            className={`${styles.categoryButton} ${categoryFilter === 'all' ? styles.active : ''}`}
                            onClick={() => setCategoryFilter('all')}
                        >
                            ALL
                        </button>
                        <button
                            className={`${styles.categoryButton} ${categoryFilter === 'role' ? styles.active : ''}`}
                            onClick={() => setCategoryFilter('role')}
                        >
                            ROLES
                        </button>
                        <button
                            className={`${styles.categoryButton} ${categoryFilter === 'theme' ? styles.active : ''}`}
                            onClick={() => setCategoryFilter('theme')}
                        >
                            THEMES
                        </button>
                        <button
                            className={`${styles.categoryButton} ${categoryFilter === 'avatar' ? styles.active : ''}`}
                            onClick={() => setCategoryFilter('avatar')}
                        >
                            AVATARS
                        </button>
                        <button
                            className={`${styles.categoryButton} ${categoryFilter === 'banner' ? styles.active : ''}`}
                            onClick={() => setCategoryFilter('banner')}
                        >
                            BANNERS
                        </button>
                        <button
                            className={`${styles.categoryButton} ${categoryFilter === 'item' ? styles.active : ''}`}
                            onClick={() => setCategoryFilter('item')}
                        >
                            ITEMS
                        </button>
                    </div>
                </div>

                <div className={styles.filterControls}>
                    {/* Game filter dropdown */}
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>GAME</label>
                        <select
                            className={styles.filterSelect}
                            value={gameFilter}
                            onChange={(e) => setGameFilter(e.target.value)}
                        >
                            <option value="all">All Games</option>
                            {availableGames.map(game => (
                                <option key={game.id} value={game.id}>{game.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort dropdown */}
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>SORT BY</label>
                        <select
                            className={styles.filterSelect}
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as ShopSortOption)}
                        >
                            <option value="featured">Featured</option>
                            <option value="price-low-high">Price: Low to High</option>
                            <option value="price-high-low">Price: High to Low</option>
                            <option value="newest">Newest</option>
                            <option value="alphabetical">A-Z</option>
                        </select>
                    </div>

                    {/* Show owned toggle */}
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>OWNED ITEMS</label>
                        <div className={styles.toggleSwitch}>
                            <input
                                type="checkbox"
                                id="showOwned"
                                checked={showOwned}
                                onChange={(e) => setShowOwned(e.target.checked)}
                            />
                            <label htmlFor="showOwned" className={styles.toggleSlider}></label>
                            <span className={styles.toggleLabel}>{showOwned ? 'SHOW' : 'HIDE'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main shop items grid */}
            <div className={styles.shopContent}>
                <h2 className={styles.sectionTitle}>
                    {getCategoryLabel(categoryFilter)}
                    {filteredItems.length > 0 && (
                        <span className={styles.itemCount}> ({filteredItems.length})</span>
                    )}
                </h2>

                {isLoading ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner}></div>
                        <div className={styles.loadingText}>Loading Shop Items...</div>
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className={styles.itemsGrid}>
                        {filteredItems.map(item => (
                            <ShopItem
                                key={item.id}
                                item={item}
                                onPurchase={handlePurchaseRequest}
                                userPoints={userPoints}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🔍</div>
                        <div className={styles.emptyText}>No items found with current filters</div>
                    </div>
                )}
            </div>

            {/* Purchase confirmation modal */}
            {showConfirmation && selectedItem && (
                <ConfirmationModal
                    isOpen={showConfirmation}
                    onClose={closeConfirmation}
                    onConfirm={confirmPurchase}
                    title="Confirm Purchase"
                    cancelButtonText="Cancel"
                    confirmButtonText="Purchase"
                    result={purchaseResult}
                >
                    <div className={styles.confirmationContent}>
                        {!purchaseResult ? (
                            <>
                                <div className={styles.confirmItemDetails}>
                                    <img
                                        src={selectedItem.image}
                                        alt={selectedItem.name}
                                        className={styles.confirmItemImage}
                                    />

                                    <div className={styles.confirmItemInfo}>
                                        <h3 className={styles.confirmItemName}>{selectedItem.name}</h3>
                                        <p className={styles.confirmItemCategory}>
                                            {selectedItem.category.charAt(0).toUpperCase() + selectedItem.category.slice(1)}
                                        </p>

                                        <div className={styles.confirmItemPrice}>
                                            {selectedItem.discountPercent ? (
                                                <>
                                                    <span className={styles.confirmOriginalPrice}>{selectedItem.price}</span>
                                                    <span className={styles.confirmDiscountedPrice}>
                            {getDiscountedPrice(selectedItem)}
                          </span>
                                                    <span className={styles.confirmDiscount}>
                            -{selectedItem.discountPercent}%
                          </span>
                                                </>
                                            ) : (
                                                <span className={styles.confirmPrice}>{selectedItem.price}</span>
                                            )}
                                            <span className={styles.confirmPointsLabel}>POINTS</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.confirmBalance}>
                                    <div className={styles.confirmBalanceRow}>
                                        <span>Current Balance:</span>
                                        <span>{formatPoints(userPoints)} POINTS</span>
                                    </div>
                                    <div className={styles.confirmBalanceRow}>
                                        <span>Purchase Price:</span>
                                        <span>-{formatPoints(getDiscountedPrice(selectedItem))} POINTS</span>
                                    </div>
                                    <div className={`${styles.confirmBalanceRow} ${styles.confirmNewBalance}`}>
                                        <span>New Balance:</span>
                                        <span>
                      {formatPoints(userPoints - getDiscountedPrice(selectedItem))} POINTS
                    </span>
                                    </div>
                                </div>

                                <p className={styles.confirmMessage}>
                                    Are you sure you want to purchase {selectedItem.name}?
                                </p>
                            </>
                        ) : (
                            <div className={`${styles.purchaseResult} ${purchaseResult.success ? styles.success : styles.error}`}>
                                <div className={styles.resultIcon}>
                                    {purchaseResult.success ? '✓' : '✗'}
                                </div>
                                <div className={styles.resultMessage}>{purchaseResult.message}</div>
                            </div>
                        )}
                    </div>
                </ConfirmationModal>
            )}
        </div>
    );
};

export default Shop;