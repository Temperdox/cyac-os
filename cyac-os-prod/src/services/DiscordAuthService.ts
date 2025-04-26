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
    STORAGE_KEY_EXPIRES: 'cyac_discord_expires'
};

// Discord user interface
interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    banner?: string;
    email?: string;
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
            scope: 'identify email',
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
     * Get current Discord user
     * @returns DiscordUser | null
     */
    public static getCurrentUser(): DiscordUser | null {
        const userJson = localStorage.getItem(CONFIG.STORAGE_KEY_USER);
        return userJson ? JSON.parse(userJson) : null;
    }

    /**
     * Get current access token
     * @returns string | null
     */
    public static getAccessToken(): string | null {
        return localStorage.getItem(CONFIG.STORAGE_KEY_TOKEN);
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