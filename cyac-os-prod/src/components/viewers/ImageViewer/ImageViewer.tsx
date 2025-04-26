import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ImageViewer.module.css';

// Interface for image data
interface ImageData {
    id: string;
    src: string;
    thumbnail?: string;
    title: string;
    description: string;
    tags: string[];
    date: string;
    dimensions?: string;
}

// Props for the ImageViewer component
interface ImageViewerProps {
    hasKeyboardFocus?: boolean;
    initialImages?: ImageData[];
    apiEndpoint?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
                                                     hasKeyboardFocus = false,
                                                     initialImages = [],
                                                     apiEndpoint,
                                                 }) => {
    // State management
    const [images, setImages] = useState<ImageData[]>(initialImages);
    const [filteredImages, setFilteredImages] = useState<ImageData[]>(initialImages);
    const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<{tag: string, color: string}[]>([]);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'title'>('newest');

    // Refs
    const observer = useRef<IntersectionObserver | null>(null);
    const lastImageElementRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Determine available tags and assign colors consistently
    useEffect(() => {
        const tags = new Set<string>();
        const tagColorMap = new Map<string, string>();
        const colors = [
            '#33ff33', // green
            '#ff3333', // red
            '#3366ff', // blue
            '#ffff33', // yellow
            '#33ffff', // cyan
            '#ff33ff', // magenta
            '#ff9933', // orange
            '#9933ff'  // purple
        ];

        // Extract all unique tags
        images.forEach(image => {
            image.tags.forEach(tag => {
                tags.add(tag);
            });
        });

        // Assign colors to tags
        let colorIndex = 0;
        tags.forEach(tag => {
            if (!tagColorMap.has(tag)) {
                tagColorMap.set(tag, colors[colorIndex % colors.length]);
                colorIndex++;
            }
        });

        // Create tag objects with colors
        const tagObjects = Array.from(tags).map(tag => ({
            tag,
            color: tagColorMap.get(tag) || colors[0]
        }));

        setAvailableTags(tagObjects);
    }, [images]);

    // Load more images (simulated or from API)
    const loadMoreImages = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);

        try {
            // If we have an API endpoint, fetch from there
            if (apiEndpoint) {
                const response = await fetch(`${apiEndpoint}?page=${page}&limit=20`);
                const data = await response.json();

                if (data.images && data.images.length > 0) {
                    setImages(prev => [...prev, ...data.images]);
                    setPage(prev => prev + 1);
                } else {
                    setHasMore(false);
                }
            } else {
                // Simulate loading more images with a delay
                await new Promise(resolve => setTimeout(resolve, 800));

                // For demo purposes, we'll generate some placeholder images if we don't have an API
                const newImages: ImageData[] = [];

                // Generate placeholder images if we're on first page and have no initial images
                if (page === 1 && images.length === 0) {
                    for (let i = 1; i <= 20; i++) {
                        const tags = [];
                        if (i % 2 === 0) tags.push('cyberacme');
                        if (i % 3 === 0) tags.push('technology');
                        if (i % 4 === 0) tags.push('retro');
                        if (i % 5 === 0) tags.push('terminal');

                        newImages.push({
                            id: `img-${i}`,
                            src: `/api/placeholder/800/600?text=CYAC Image ${i}`,
                            thumbnail: `/api/placeholder/200/150?text=CYAC Image ${i}`,
                            title: `CYAC Image ${i}`,
                            description: `A sample image for the CyberAcme Terminal viewer. Image ${i} of collection.`,
                            tags: tags.length > 0 ? tags : ['misc'],
                            date: new Date(Date.now() - (i * 86400000)).toISOString().split('T')[0] // Random dates
                        });
                    }

                    setImages(newImages);
                    setPage(prev => prev + 1);
                } else {
                    // For subsequent pages, stop loading
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error('Error loading images:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page, apiEndpoint, images.length]);

    // Set up intersection observer for infinite scrolling
    useEffect(() => {
        // Disconnect any existing observer
        if (observer.current) {
            observer.current.disconnect();
        }

        // Create a new observer
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !selectedImage) {
                loadMoreImages();
            }
        }, { rootMargin: '100px' });

        // Observe the last image element
        if (lastImageElementRef.current) {
            observer.current.observe(lastImageElementRef.current);
        }

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [loadMoreImages, hasMore, selectedImage]);

    // Load initial images
    useEffect(() => {
        if (images.length === 0) {
            loadMoreImages();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Filter and sort images based on search term and tags
    useEffect(() => {
        let filtered = [...images];

        // Apply search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(image =>
                image.title.toLowerCase().includes(term) ||
                image.description.toLowerCase().includes(term) ||
                image.tags.some(tag => tag.toLowerCase().includes(term))
            );
        }

        // Apply tag filter
        if (selectedTags.length > 0) {
            filtered = filtered.filter(image =>
                selectedTags.every(tag => image.tags.includes(tag))
            );
        }

        // Apply sorting
        if (sortOrder === 'newest') {
            filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } else if (sortOrder === 'oldest') {
            filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } else if (sortOrder === 'title') {
            filtered.sort((a, b) => a.title.localeCompare(b.title));
        }

        setFilteredImages(filtered);
    }, [images, searchTerm, selectedTags, sortOrder]);

    // Handle keyboard navigation when focused
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!hasKeyboardFocus) return;

            switch (e.key) {
                case 'Escape':
                    if (selectedImage) {
                        setSelectedImage(null);
                    }
                    break;
                case 'ArrowLeft':
                    if (selectedImage) {
                        const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
                        if (currentIndex > 0) {
                            setSelectedImage(filteredImages[currentIndex - 1]);
                        }
                    }
                    break;
                case 'ArrowRight':
                    if (selectedImage) {
                        const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
                        if (currentIndex < filteredImages.length - 1) {
                            setSelectedImage(filteredImages[currentIndex + 1]);
                        }
                    }
                    break;
                case '/':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        searchInputRef.current?.focus();
                    }
                    break;
                default:
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [hasKeyboardFocus, selectedImage, filteredImages]);

    // Toggle a tag selection
    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    // Reset all filters
    const resetFilters = () => {
        setSearchTerm('');
        setSelectedTags([]);
        setSortOrder('newest');
    };

    // Get tag color
    const getTagColor = (tag: string) => {
        const tagObj = availableTags.find(t => t.tag === tag);
        return tagObj?.color || '#33ff33'; // Default to green
    };

    return (
        <div className={styles.imageViewer}>
            {selectedImage ? (
                /* Full image view */
                <div className={styles.fullImageView}>
                    <div className={styles.fullImageHeader}>
                        <h2 className={styles.fullImageTitle}>{selectedImage.title}</h2>
                        <button
                            className={styles.closeButton}
                            onClick={() => setSelectedImage(null)}
                            aria-label="Close image view"
                        >
                            ×
                        </button>
                    </div>

                    <div className={styles.fullImageContainer}>
                        <img
                            src={selectedImage.src}
                            alt={selectedImage.title}
                            className={styles.fullImage}
                        />
                    </div>

                    <div className={styles.fullImageInfo}>
                        <div className={styles.imageMetadata}>
                            <div className={styles.imageDate}>Date: {selectedImage.date}</div>
                            {selectedImage.dimensions && (
                                <div className={styles.imageDimensions}>Dimensions: {selectedImage.dimensions}</div>
                            )}
                        </div>

                        <div className={styles.imageDescription}>{selectedImage.description}</div>

                        <div className={styles.imageTags}>
                            {selectedImage.tags.map(tag => (
                                <span
                                    key={tag}
                                    className={styles.imageTag}
                                    style={{ backgroundColor: getTagColor(tag) }}
                                >
                  {tag}
                </span>
                            ))}
                        </div>

                        <div className={styles.navigationButtons}>
                            <button
                                className={styles.navButton}
                                onClick={() => {
                                    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
                                    if (currentIndex > 0) {
                                        setSelectedImage(filteredImages[currentIndex - 1]);
                                    }
                                }}
                                disabled={filteredImages.findIndex(img => img.id === selectedImage.id) === 0}
                            >
                                ◄ Previous
                            </button>

                            <button
                                className={styles.navButton}
                                onClick={() => {
                                    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
                                    if (currentIndex < filteredImages.length - 1) {
                                        setSelectedImage(filteredImages[currentIndex + 1]);
                                    }
                                }}
                                disabled={
                                    filteredImages.findIndex(img => img.id === selectedImage.id) ===
                                    filteredImages.length - 1
                                }
                            >
                                Next ►
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Gallery view */
                <div className={styles.galleryView}>
                    <div className={styles.galleryHeader}>
                        <h1 className={styles.galleryTitle}>CYBERACME IMAGE GALLERY</h1>

                        <div className={styles.searchBar}>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search images..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
                            {searchTerm && (
                                <button
                                    className={styles.clearSearchButton}
                                    onClick={() => setSearchTerm('')}
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        <div className={styles.filterControls}>
                            <div className={styles.sortControl}>
                                <label htmlFor="sort-order">Sort by:</label>
                                <select
                                    id="sort-order"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'title')}
                                    className={styles.sortSelect}
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="title">Title A-Z</option>
                                </select>
                            </div>

                            <button
                                className={styles.resetButton}
                                onClick={resetFilters}
                                disabled={!searchTerm && selectedTags.length === 0 && sortOrder === 'newest'}
                            >
                                Reset Filters
                            </button>
                        </div>

                        {availableTags.length > 0 && (
                            <div className={styles.tagFilter}>
                                <div className={styles.tagTitle}>Filter by tags:</div>
                                <div className={styles.tagList}>
                                    {availableTags.map(({tag, color}) => (
                                        <button
                                            key={tag}
                                            className={`${styles.tagButton} ${selectedTags.includes(tag) ? styles.tagSelected : ''}`}
                                            style={{
                                                backgroundColor: selectedTags.includes(tag) ? color : 'transparent',
                                                borderColor: color
                                            }}
                                            onClick={() => toggleTag(tag)}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.resultSummary}>
                            Showing {filteredImages.length} of {images.length} images
                            {(searchTerm || selectedTags.length > 0) && ' (filtered)'}
                        </div>
                    </div>

                    <div className={styles.galleryGrid}>
                        {filteredImages.length > 0 ? (
                            filteredImages.map((image, index) => {
                                const isLastElement = index === filteredImages.length - 1;

                                return (
                                    <div
                                        key={image.id}
                                        ref={isLastElement ? lastImageElementRef : null}
                                        className={styles.imageCard}
                                        onClick={() => setSelectedImage(image)}
                                    >
                                        <div className={styles.thumbnailContainer}>
                                            <img
                                                src={image.thumbnail || image.src}
                                                alt={image.title}
                                                className={styles.thumbnail}
                                            />
                                        </div>
                                        <div className={styles.imageInfo}>
                                            <h3 className={styles.imageTitle}>{image.title}</h3>
                                            <div className={styles.imageTags}>
                                                {image.tags.slice(0, 3).map(tag => (
                                                    <span
                                                        key={tag}
                                                        className={styles.imageTag}
                                                        style={{ backgroundColor: getTagColor(tag) }}
                                                    >
                            {tag}
                          </span>
                                                ))}
                                                {image.tags.length > 3 && (
                                                    <span className={styles.moreTags}>+{image.tags.length - 3}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={styles.noResults}>
                                <div className={styles.noResultsIcon}>🔍</div>
                                <div className={styles.noResultsText}>
                                    No images found matching your criteria
                                </div>
                                <button className={styles.resetButton} onClick={resetFilters}>
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </div>

                    {loading && (
                        <div className={styles.loadingIndicator}>
                            <div className={styles.loadingSpinner}></div>
                            <div>Loading more images...</div>
                        </div>
                    )}

                    {!hasMore && !loading && images.length > 0 && (
                        <div className={styles.endMessage}>
                            — End of gallery —
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ImageViewer;