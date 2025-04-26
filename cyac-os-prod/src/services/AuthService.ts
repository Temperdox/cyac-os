/**
 * User interface for authentication
 */
interface User {
    username: string;
    accessLevel: number;
    loginTime: string;
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
 * Handles user authentication and session management
 */
export class AuthService {
    // Current user information
    private static currentUser: User | null = null;

    // Demo user for testing - in a real app, this would be a server call
    private static readonly demoUsers: Record<string, User> = {
        'admin': {
            username: 'admin',
            accessLevel: 10, // Admin level
            loginTime: new Date().toISOString()
        },
        'user': {
            username: 'user',
            accessLevel: 5, // Standard user
            loginTime: new Date().toISOString()
        },
        'guest': {
            username: 'guest',
            accessLevel: 1, // Guest level
            loginTime: new Date().toISOString()
        }
    };

    // Demo passwords - in a real app, passwords would be hashed and stored securely
    private static readonly demoPasswords: Record<string, string> = {
        'admin': 'admin123',
        'user': 'user123',
        'guest': 'guest123'
    };

    /**
     * Attempt to log in a user
     * @param username Username
     * @param password Password
     * @returns Authentication result
     */
    public static login(username: string, password: string = ''): AuthResult {
        // In a real app, this would validate against a server
        // For the demo, we'll use hardcoded users

        // Check if username exists
        if (!(username in this.demoUsers)) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        // Check password (guest user doesn't need password)
        if (username !== 'guest' && this.demoPasswords[username] !== password) {
            return {
                success: false,
                message: 'Invalid password'
            };
        }

        // Set current user
        this.currentUser = {
            ...this.demoUsers[username],
            loginTime: new Date().toISOString()
        };

        // Save to local storage for persistence
        try {
            localStorage.setItem('cyac_user', JSON.stringify(this.currentUser));
        } catch (error) {
            console.warn('Failed to save user to local storage:', error);
        }

        return {
            success: true,
            message: 'Login successful',
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