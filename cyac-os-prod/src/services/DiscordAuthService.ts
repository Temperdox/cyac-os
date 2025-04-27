// src/services/DiscordAuthService.ts

// Configuration - update these values for your environment
const CONFIG = {
    // API endpoint for Discord auth - replace with your actual worker URL
    API_ENDPOINT: 'https://cyac-os.cdbabmaina.workers.dev',

    // Discord OAuth configuration
    CLIENT_ID: '1364594366756421673',
    REDIRECT_URI: `${window.location.origin}/auth/callback`,

    // Local storage keys
    STORAGE_KEY_TOKEN: 'cyac_discord_token',
    STORAGE_KEY_USER: 'cyac_discord_user',
    STORAGE_KEY_EXPIRES: 'cyac_discord_expires',
    STORAGE_KEY_FAKE_PRIVILEGE: 'cyac_fake_privilege',

    // Developer Discord IDs - add IDs of accounts that should have dev privileges
    DEV_IDS: [
        '123456789012345678', // Example ID 1 - replace with actual Discord IDs
        '876543210987654321'  // Example ID 2
    ]
};

// Discord user interface
interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    banner?: string;
    email?: string;
    isPrivileged?: boolean;   // Any authenticated Discord user
    isDev?: boolean;          // User with ID in DEV_IDS list
    isFakePrivilegeElevated?: boolean; // For fake hacking functionality
    accessLevel?: number;     // Numeric access level (higher = more privileges)
}

// Auth tokens interface
interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    jwt: string;
}

/**
 * Service for handling Discord authentication
 */
export class DiscordAuthService {
    /**
     * Initiates the Discord OAuth flow
     */
    public static login(): void {
        const params = new URLSearchParams({
            client_id: CONFIG.CLIENT_ID,
            redirect_uri: CONFIG.REDIRECT_URI,
            response_type: 'code',
            scope: 'identify',
        });

        // Redirect to Discord OAuth
        window.location.href = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    }

    /**
     * Logout user by clearing stored tokens
     */
    public static logout(): void {
        localStorage.removeItem(CONFIG.STORAGE_KEY_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEY_USER);
        localStorage.removeItem(CONFIG.STORAGE_KEY_EXPIRES);
        localStorage.removeItem(CONFIG.STORAGE_KEY_FAKE_PRIVILEGE);
    }

    /**
     * Handle OAuth callback after Discord login
     * @param code Authorization code from Discord
     * @returns Promise<boolean> Success status
     */
    public static async handleCallback(code: string): Promise<boolean> {
        try {
            // Exchange code for tokens
            const response = await fetch(`${CONFIG.API_ENDPOINT}/auth/discord/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            });

            if (!response.ok) {
                throw new Error(`Token exchange failed: ${response.status}`);
            }

            const data = await response.json() as AuthTokens & { user?: DiscordUser };

            if (data.user) {
                // Initialize privilege flags to false
                this.initializeUserPrivileges(data.user);

                // Then set appropriate privileges based on authentication
                this.setUserPrivileges(data.user);
            }

            // Save auth data to local storage
            this.saveAuthData(data);

            return true;
        } catch (error) {
            console.error('Auth callback error:', error);
            return false;
        }
    }

    /**
     * Check if user is currently authenticated
     * @returns Promise<boolean>
     */
    public static async isAuthenticated(): Promise<boolean> {
        try {
            const token = localStorage.getItem(CONFIG.STORAGE_KEY_TOKEN);
            const expiresAt = localStorage.getItem(CONFIG.STORAGE_KEY_EXPIRES);

            if (!token || !expiresAt) {
                return false;
            }

            // Check if token is expired
            const expiresAtDate = new Date(expiresAt);
            if (expiresAtDate <= new Date()) {
                // Could implement refresh token logic here
                this.logout();
                return false;
            }

            // Validate token by fetching user info
            const user = await this.fetchUserInfo();
            return !!user;
        } catch (error) {
            console.error('Authentication check error:', error);
            return false;
        }
    }

    /**
     * Simple synchronous check if the user appears to be authenticated
     * Does not validate the token with the server
     * @returns boolean
     */
    private static hasAuthToken(): boolean {
        const token = localStorage.getItem(CONFIG.STORAGE_KEY_TOKEN);
        const expiresAt = localStorage.getItem(CONFIG.STORAGE_KEY_EXPIRES);

        if (!token || !expiresAt) {
            return false;
        }

        // Check if token is expired
        const expiresAtDate = new Date(expiresAt);
        return expiresAtDate > new Date();
    }

    /**
     * Get current Discord user
     * @returns DiscordUser | null
     */
    public static getCurrentUser(): DiscordUser | null {
        const userJson = localStorage.getItem(CONFIG.STORAGE_KEY_USER);
        if (!userJson) return null;

        const user = JSON.parse(userJson) as DiscordUser;

        // Make sure privilege flags are correctly set
        if (this.hasAuthToken()) {
            this.setUserPrivileges(user);
        } else {
            // Reset privileges if no valid token
            this.initializeUserPrivileges(user);
        }

        return user;
    }

    /**
     * Get current access token
     * @returns string | null
     */
    public static getAccessToken(): string | null {
        return localStorage.getItem(CONFIG.STORAGE_KEY_TOKEN);
    }

    /**
     * Check if current user is a developer
     * This is a synchronous convenience method - use with caution
     * @returns boolean
     */
    public static isDevUser(): boolean {
        // Must have auth token to be a dev
        if (!this.hasAuthToken()) {
            return false;
        }

        const user = this.getCurrentUser();
        return !!user?.isDev;
    }

    /**
     * Check if user is a developer (async version that validates authentication)
     * @returns Promise<boolean>
     */
    public static async isDevUserAsync(): Promise<boolean> {
        // Must be authenticated to be a dev
        const authenticated = await this.isAuthenticated();
        if (!authenticated) {
            return false;
        }

        const user = this.getCurrentUser();
        return !!user?.isDev;
    }

    /**
     * Toggle fake privilege elevation
     * @param enabled Whether to enable or disable fake privilege
     */
    public static setFakePrivilegeElevation(enabled: boolean): void {
        const user = this.getCurrentUser();
        if (!user) return;

        // Must have auth token to set privileges
        if (!this.hasAuthToken()) {
            return;
        }

        user.isFakePrivilegeElevated = enabled;

        // Update access level based on the fake privilege status
        if (enabled) {
            user.accessLevel = 10; // High access level for "hacked" users
            localStorage.setItem(CONFIG.STORAGE_KEY_FAKE_PRIVILEGE, 'true');
        } else {
            // Reset to normal level
            this.setUserPrivileges(user);
            localStorage.removeItem(CONFIG.STORAGE_KEY_FAKE_PRIVILEGE);
        }

        // Save updated user
        localStorage.setItem(CONFIG.STORAGE_KEY_USER, JSON.stringify(user));
    }

    /**
     * Check if user has fake privilege elevation
     * @returns boolean
     */
    public static hasFakePrivilegeElevation(): boolean {
        // Must have auth token to have privileges
        if (!this.hasAuthToken()) {
            return false;
        }

        return localStorage.getItem(CONFIG.STORAGE_KEY_FAKE_PRIVILEGE) === 'true';
    }

    /**
     * Initialize all privilege flags to false
     * @param user Discord user object
     * @private
     */
    private static initializeUserPrivileges(user: DiscordUser): void {
        user.isPrivileged = false;
        user.isDev = false;
        user.isFakePrivilegeElevated = false;
        user.accessLevel = 0; // Guest level
    }

    /**
     * Set privilege flags on user object
     * @param user Discord user object
     * @private
     */
    private static setUserPrivileges(user: DiscordUser): void {
        // Start with all privileges false
        this.initializeUserPrivileges(user);

        // Only set privileges if we have a valid user ID
        if (user && user.id) {
            // All authenticated Discord users are privileged
            user.isPrivileged = true;

            // Check if user is a developer (must be in DEV_IDS list)
            user.isDev = CONFIG.DEV_IDS.includes(user.id);

            // Set fake privilege if previously enabled
            user.isFakePrivilegeElevated = this.hasFakePrivilegeElevation();

            // Set access level based on privileges
            if (user.isFakePrivilegeElevated) {
                user.accessLevel = 10; // Highest level for "hacked" users
            } else if (user.isDev) {
                user.accessLevel = 5;  // Level for developers
            } else if (user.isPrivileged) {
                user.accessLevel = 1;  // Basic privileged user level
            } else {
                user.accessLevel = 0;  // Guest level
            }
        }
    }

    /**
     * Save authentication data to local storage
     * @param data Auth response data
     * @private
     */
    private static saveAuthData(data: any): void {
        // Calculate expiration time
        const expiresIn = data.expires_in * 1000; // Convert to milliseconds
        const expiresAt = new Date(Date.now() + expiresIn).toISOString();

        // Save tokens
        localStorage.setItem(CONFIG.STORAGE_KEY_TOKEN, data.access_token);
        localStorage.setItem(CONFIG.STORAGE_KEY_EXPIRES, expiresAt);

        // Save user info
        if (data.user) {
            localStorage.setItem(CONFIG.STORAGE_KEY_USER, JSON.stringify(data.user));
        }
    }

    /**
     * Fetch user info from Discord API
     * @returns Promise<DiscordUser | null>
     * @private
     */
    private static async fetchUserInfo(): Promise<DiscordUser | null> {
        try {
            const token = this.getAccessToken();

            if (!token) {
                return null;
            }

            const response = await fetch(`${CONFIG.API_ENDPOINT}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch user info: ${response.status}`);
            }

            const data = await response.json();

            // Save updated user data
            if (data.user) {
                // Initialize privileges to false
                this.initializeUserPrivileges(data.user);

                // Then set appropriate privileges based on authentication
                this.setUserPrivileges(data.user);

                localStorage.setItem(CONFIG.STORAGE_KEY_USER, JSON.stringify(data.user));
                return data.user;
            }

            return null;
        } catch (error) {
            console.error('Error fetching user info:', error);
            return null;
        }
    }
}

export default DiscordAuthService;