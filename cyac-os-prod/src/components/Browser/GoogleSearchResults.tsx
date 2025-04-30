import React, { useState, useEffect } from 'react';
import styles from './CyAc_browser_v1.module.css';

interface SearchResult {
    kind: string;
    title: string;
    htmlTitle?: string;
    link: string;
    displayLink: string;
    snippet: string;
    htmlSnippet?: string;
    formattedUrl?: string;
    htmlFormattedUrl?: string;
    pagemap?: {
        cse_thumbnail?: Array<{
            src: string;
            width: string;
            height: string;
        }>;
        cse_image?: Array<{
            src: string;
        }>;
    };
}

interface SearchResponse {
    kind: string;
    url: {
        type: string;
        template: string;
    };
    queries: {
        request: Array<{
            totalResults: string;
            searchTerms: string;
        }>;
    };
    context: {
        title: string;
    };
    searchInformation: {
        searchTime: number;
        formattedSearchTime: string;
        totalResults: string;
        formattedTotalResults: string;
    };
    items: SearchResult[];
}

interface SearchInfo {
    totalResults: string;
    searchTime: string;
}

interface GoogleSearchResultsProps {
    url: string;
    onNavigate: (url: string) => void;
}

const GoogleSearchResults: React.FC<GoogleSearchResultsProps> = ({ url, onNavigate }) => {
    // State for input, results and loading
    const [inputValue, setInputValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchInfo, setSearchInfo] = useState<SearchInfo | null>(null);

    // Initialize the input value from the URL
    useEffect(() => {
        let initialQuery = '';

        try {
            if (url.includes('google.com/search')) {
                // Extract query from existing Google search URL
                const urlObj = new URL(url);
                initialQuery = urlObj.searchParams.get('q') || '';
            } else if (url.startsWith('http')) {
                // For an actual URL, use the domain as the search term
                const urlObj = new URL(url);
                initialQuery = urlObj.hostname;
            } else {
                // Use the raw input as the search term
                initialQuery = url;
            }
        } catch (e) {
            // If URL parsing fails, just use the URL as is
            initialQuery = url;
        }

        setInputValue(initialQuery);

        // Only perform initial search if there's a query and it's not just a URL
        if (initialQuery && !initialQuery.includes('.')) {
            setSearchQuery(initialQuery);
        }
    }, [url]);

    // Effect to perform search when searchQuery changes
    useEffect(() => {
        if (!searchQuery) return;

        const performSearch = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Call your search API endpoint
                const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);

                if (!response.ok) {
                    throw new Error(`Search failed: ${response.status} ${response.statusText}`);
                }

                const data: SearchResponse = await response.json();

                if (data.items && Array.isArray(data.items)) {
                    setResults(data.items);

                    if (data.searchInformation) {
                        setSearchInfo({
                            totalResults: data.searchInformation.formattedTotalResults,
                            searchTime: data.searchInformation.formattedSearchTime
                        });
                    }
                } else {
                    setResults([]);
                    setSearchInfo(null);
                }
            } catch (err) {
                console.error('Error performing search:', err);
                setError(err instanceof Error ? err.message : 'Search failed');
                // Generate fallback results
                generateFallbackResults(searchQuery);
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
    }, [searchQuery]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            setSearchQuery(inputValue.trim());
        }
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        // We don't update searchQuery here so search isn't triggered on every keystroke
    };

    // Handle result click
    const handleResultClick = (e: React.MouseEvent, link: string) => {
        e.preventDefault();
        onNavigate(link);
    };

    // Generate fallback results
    const generateFallbackResults = (query: string) => {
        // Simple fallback results in case the API fails
        const fallbackResults: SearchResult[] = [
            {
                kind: "customsearch#result",
                title: `${query} - Search Results`,
                link: `https://www.example.com/search?q=${encodeURIComponent(query)}`,
                snippet: `Showing results for ${query}. Try broadening your search or check your network connection.`,
                displayLink: 'www.example.com'
            },
            {
                kind: "customsearch#result",
                title: 'Network Status',
                link: 'https://www.example.com/status',
                snippet: 'The search system is currently experiencing technical difficulties. Please try again later.',
                displayLink: 'www.example.com'
            }
        ];

        setResults(fallbackResults);
    };

    return (
        <div className={styles.searchContainer}>
            <div className={styles.searchHeader}>
                <div className={styles.searchLogo}>CYBERSEARCH</div>
                <form className={styles.searchForm} onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        className={styles.searchInput}
                        placeholder="Enter search query"
                    />
                    <button type="submit" className={styles.searchButton}>
                        SEARCH
                    </button>
                </form>
            </div>

            {isLoading ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.searchSpinner}></div>
                    <p>Searching for "{searchQuery}"...</p>
                </div>
            ) : error ? (
                <div className={styles.errorContainer}>
                    <p className={styles.errorMessage}>{error}</p>
                    <p className={styles.errorHelp}>Please try again or refine your search query.</p>
                </div>
            ) : (
                <>
                    {searchInfo && (
                        <div className={styles.searchStats}>
                            About {searchInfo.totalResults} results ({searchInfo.searchTime} seconds)
                        </div>
                    )}

                    <div className={styles.searchResults}>
                        {results.length === 0 ? (
                            <div className={styles.noResults}>
                                <p>No results found for "{searchQuery}"</p>
                                <p>Try different keywords or check your spelling</p>
                            </div>
                        ) : (
                            results.map((result, index) => (
                                <div key={index} className={styles.searchResult}>
                                    <div className={styles.resultMeta}>
                                        <span className={styles.resultUrl}>{result.displayLink}</span>
                                    </div>
                                    <h3 className={styles.resultTitle}>
                                        <a
                                            href={result.link}
                                            onClick={(e) => handleResultClick(e, result.link)}
                                            className={styles.resultLink}
                                            dangerouslySetInnerHTML={{ __html: result.htmlTitle || result.title }}
                                        ></a>
                                    </h3>
                                    <p
                                        className={styles.resultSnippet}
                                        dangerouslySetInnerHTML={{ __html: result.htmlSnippet || result.snippet }}
                                    ></p>

                                    {/* Optional thumbnail */}
                                    {result.pagemap?.cse_thumbnail && (
                                        <div className={styles.resultThumbnail}>
                                            <img
                                                src={result.pagemap.cse_thumbnail[0].src}
                                                alt=""
                                                width={result.pagemap.cse_thumbnail[0].width}
                                                height={result.pagemap.cse_thumbnail[0].height}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {results.length > 0 && (
                        <div className={styles.pagination}>
                            <button className={`${styles.paginationButton} ${styles.disabled}`} disabled>
                                Previous
                            </button>
                            <div className={styles.pageNumbers}>
                                <span className={styles.currentPage}>1</span>
                                <span>2</span>
                                <span>3</span>
                                <span>4</span>
                                <span>5</span>
                            </div>
                            <button className={styles.paginationButton}>
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GoogleSearchResults;