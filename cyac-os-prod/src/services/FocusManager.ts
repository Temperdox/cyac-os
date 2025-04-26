// FocusManager.ts

/**
 * Focus element types for the application
 */
export type FocusElement = 'terminal' | 'window' | 'quickMenu' | 'none';

/**
 * Focus change listener type
 */
export type FocusChangeListener = (focusId: string) => void;

/**
 * Focus Manager service
 * Handles focus management across components
 */
export class FocusManager {
    // Current focus state
    private static currentFocus: FocusElement = 'none';
    private static activeWindowId: string | null = null;
    private static listeners: Map<string, FocusChangeListener> = new Map();
    private static isInitialized = false;
    private static debugMode = false;

    /**
     * Initialize the focus manager
     */
    public static initialize(): void {
        if (this.isInitialized) return;

        // Set up global click handler to detect clicks outside managed elements
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            // Check if click is on a managed element
            const isTerminal = !!target.closest('[data-focus="terminal"]');
            const isWindow = !!target.closest('[data-focus="window"]');
            const isQuickMenu = !!target.closest('[data-focus="quick-menu"]');

            // If not, set focus to none
            if (!isTerminal && !isWindow && !isQuickMenu) {
                this.setFocus('none', null);
            }
        });

        // Set global flag to signal terminal has focus by default
        window.terminalHasFocus = true;
        this.currentFocus = 'terminal';

        this.isInitialized = true;
        this.log('Focus Manager initialized');
    }

    /**
     * Set focus to an element
     * @param element The element type to focus
     * @param id Optional ID for specific instances (like window ID)
     */
    public static setFocus(element: FocusElement, id: string | null = null): void {
        const previousFocus = this.currentFocus;
        const previousWindowId = this.activeWindowId;

        this.currentFocus = element;

        // If focusing a window, update active window ID
        if (element === 'window' && id) {
            this.activeWindowId = id;
        } else if (element !== 'window') {
            // If focusing something other than a window, clear active window ID
            this.activeWindowId = null;
        }

        // Update global terminal focus flag
        window.terminalHasFocus = element === 'terminal';

        // Notify listeners if focus changed
        if (previousFocus !== this.currentFocus || previousWindowId !== this.activeWindowId) {
            this.log(`Focus changed from ${previousFocus}${previousWindowId ? ':' + previousWindowId : ''} to ${this.currentFocus}${this.activeWindowId ? ':' + this.activeWindowId : ''}`);
            this.notifyListeners();
        }
    }

    /**
     * Set the active window
     * @param windowId The ID of the window to activate
     */
    public static setActiveWindow(windowId: string): void {
        if (windowId === this.activeWindowId && this.currentFocus === 'window') {
            // Already focused, no need to update
            return;
        }

        this.setFocus('window', windowId);
    }

    /**
     * Get the current focus element type
     */
    public static getCurrentFocus(): FocusElement {
        return this.currentFocus;
    }

    /**
     * Get the ID of the active window (if any)
     */
    public static getActiveWindowId(): string | null {
        return this.activeWindowId;
    }

    /**
     * Check if terminal is focused
     */
    public static isTerminalFocused(): boolean {
        return this.currentFocus === 'terminal';
    }

    /**
     * Check if a specific window is focused
     * @param windowId The window ID to check
     */
    public static isWindowFocused(windowId: string): boolean {
        return this.currentFocus === 'window' && this.activeWindowId === windowId;
    }

    /**
     * Check if quick menu is focused
     */
    public static isQuickMenuFocused(): boolean {
        return this.currentFocus === 'quickMenu';
    }

    /**
     * Add a focus change listener
     * @param id Unique identifier for the listener
     * @param listener Function to call when focus changes
     */
    public static addListener(id: string, listener: FocusChangeListener): void {
        this.listeners.set(id, listener);
        this.log(`Added focus listener: ${id}`);
    }

    /**
     * Remove a focus change listener
     * @param id The identifier of the listener to remove
     */
    public static removeListener(id: string): void {
        this.listeners.delete(id);
        this.log(`Removed focus listener: ${id}`);
    }

    /**
     * Notify all listeners of focus change
     */
    private static notifyListeners(): void {
        // Create a focus ID that includes the current focus and window ID if applicable
        const focusId = this.currentFocus === 'window' && this.activeWindowId
            ? `window:${this.activeWindowId}`
            : this.currentFocus;

        // Notify all listeners
        this.listeners.forEach((listener, id) => {
            try {
                this.log(`Notifying listener: ${id}`);
                listener(focusId);
            } catch (error) {
                console.error(`Error in focus listener ${id}:`, error);
            }
        });

        // Dispatch DOM events for compatibility with non-React components
        this.dispatchFocusEvent(focusId);
    }

    /**
     * Dispatch custom DOM events for focus changes
     * @param focusId The focus identifier
     */
    private static dispatchFocusEvent(focusId: string): void {
        // General focus change event
        const focusEvent = new CustomEvent('focus:changed', {
            detail: {
                focus: this.currentFocus,
                windowId: this.activeWindowId,
                focusId
            }
        });
        window.dispatchEvent(focusEvent);

        // Specific events for common focus targets
        if (this.currentFocus === 'terminal') {
            window.dispatchEvent(new CustomEvent('terminal:focused'));
        } else if (this.currentFocus === 'window') {
            window.dispatchEvent(new CustomEvent('window:focused', {
                detail: { windowId: this.activeWindowId }
            }));
        } else if (this.currentFocus === 'quickMenu') {
            window.dispatchEvent(new CustomEvent('quickMenu:focused'));
        }
    }

    /**
     * Enable or disable debug mode
     * @param enabled Whether debug mode should be enabled
     */
    public static setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
        this.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Log message if debug mode is enabled
     * @param message The message to log
     */
    private static log(message: string): void {
        if (this.debugMode) {
            console.log(`[FocusManager] ${message}`);
        }
    }
}

// Add terminalHasFocus to window object
declare global {
    interface Window {
        terminalHasFocus: boolean;
    }
}