/**
 * User interface for authentication
 */
interface User {
    username: string;
    accessLevel: number;
    loginTime: string;
    discordId?: string;
    avatar?: string;
    banner?: string;
    isDev?: boolean;
    isPrivileged?: boolean;
}

/**
 * Authentication result interface
 */
interface AuthResult {
    success: boolean;
    message: string;
    username?: string;
}

/**
 * Authentication Service
 * Handles user authentication and session management with Discord
 */
export class AuthService {
    // Current user information
    private static currentUser: User | null = null;

    /**
     * Login with Discord credentials
     * @param discordUser Discord user object
     * @returns Authentication result
     */
    public static loginWithDiscord(discordUser: any): AuthResult {
        if (!discordUser || !discordUser.id || !discordUser.username) {
            return {
                success: false,
                message: 'Invalid Discord user data'
            };
        }

        // Create user with Discord properties
        this.currentUser = {
            username: discordUser.username,
            accessLevel: discordUser.accessLevel || 1,
            loginTime: new Date().toISOString(),
            discordId: discordUser.id,
            avatar: discordUser.avatar,
            banner: discordUser.banner,
            isDev: discordUser.isDev || false,
            isPrivileged: discordUser.isPrivileged || false
        };

        // Save to local storage for persistence
        try {
            localStorage.setItem('cyac_user', JSON.stringify(this.currentUser));
        } catch (error) {
            console.warn('Failed to save user to local storage:', error);
        }

        return {
            success: true,
            message: 'Discord login successful',
            username: this.currentUser.username
        };
    }

    /**
     * Log out the current user
     * @returns Logout result
     */
    public static logout(): AuthResult {
        if (!this.currentUser) {
            return {
                success: true,
                message: 'Not logged in'
            };
        }

        // Clear current user
        this.currentUser = null;

        // Clear from local storage
        try {
            localStorage.removeItem('cyac_user');
        } catch (error) {
            console.warn('Failed to clear user from local storage:', error);
        }

        return {
            success: true,
            message: 'Logout successful'
        };
    }

    /**
     * Check if a user is currently authenticated
     * @returns Whether a user is authenticated
     */
    public static isAuthenticated(): boolean {
        return !!this.currentUser;
    }

    /**
     * Get the current user object
     * @returns Current user object or null if not logged in
     */
    public static getCurrentUser(): User | null {
        return this.currentUser;
    }

    /**
     * Check access level requirements
     * @param requiredLevel Required access level
     * @returns Whether current user has sufficient access
     */
    public static hasAccess(requiredLevel: number): boolean {
        if (!this.currentUser) return false;
        return this.currentUser.accessLevel >= requiredLevel;
    }

    /**
     * Check if current user is a developer
     * @returns Whether current user has developer privileges
     */
    public static isDevUser(): boolean {
        return !!this.currentUser?.isDev;
    }

    /**
     * Initialize authentication service
     * Restores session from local storage if available
     */
    public static initialize(): void {
        try {
            const saved = localStorage.getItem('cyac_user');
            if (saved) {
                // Parse into a concrete User before assigning,
                // so we can safely read .username
                const user = JSON.parse(saved) as User;
                this.currentUser = user;
                console.log('Restored user session:', user.username);
            }
        } catch (error) {
            console.warn('Failed to restore user session:', error);
        }
    }
}