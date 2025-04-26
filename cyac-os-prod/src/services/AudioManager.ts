/**
 * Interface for audio options
 */
interface AudioOptions {
    volume?: number;
    loop?: boolean;
    autoplay?: boolean;
    fadeIn?: number; // Fade in duration in ms
    fadeOut?: number; // Fade out duration in ms
}

/**
 * Audio Manager Service
 * Handles audio playback throughout the application
 */
export class AudioManager {
    // Audio elements collection
    private static audioElements: Map<string, HTMLAudioElement> = new Map();

    // Audio options storage to remember settings for each sound
    private static audioOptions: Map<string, AudioOptions> = new Map();

    // State flags
    private static initialized: boolean = false;
    private static enabled: boolean = true;
    private static masterVolume: number = 0.7;
    private static hasUserInteraction: boolean = false;
    private static pendingSounds: Array<{
        id: string;
        src: string;
        options?: AudioOptions;
    }> = [];

    /**
     * Initialize the audio manager
     * @returns Boolean indicating if initialization was successful
     */
    public static initialize(): boolean {
        if (this.initialized) return true;

        try {
            // Check if audio is supported
            const audioSupported = typeof Audio !== 'undefined';

            if (!audioSupported) {
                console.warn('Audio is not supported in this browser');
                return false;
            }

            // Set up user interaction detector
            this.setupUserInteractionDetector();

            // Load settings from local storage
            this.loadSettings();

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing AudioManager:', error);
            return false;
        }
    }

    /**
     * Set up a detector for user interaction
     * Browsers require user interaction before playing audio
     */
    private static setupUserInteractionDetector(): void {
        const interactionEvents = ['click', 'touchstart', 'keydown'];

        const handleUserInteraction = () => {
            if (!this.hasUserInteraction) {
                this.hasUserInteraction = true;
                console.log('User interaction detected - audio can now be played');

                // Play any pending sounds
                this.playPendingSounds();

                // Remove event listeners
                interactionEvents.forEach(event => {
                    document.removeEventListener(event, handleUserInteraction);
                });
            }
        };

        // Add event listeners
        interactionEvents.forEach(event => {
            document.addEventListener(event, handleUserInteraction);
        });
    }

    /**
     * Load audio settings from local storage
     */
    private static loadSettings(): void {
        try {
            const settingsStr = localStorage.getItem('cyac_audio_settings');
            if (settingsStr) {
                const settings = JSON.parse(settingsStr);

                if (settings.enabled !== undefined) {
                    this.enabled = settings.enabled;
                }

                if (settings.masterVolume !== undefined) {
                    this.masterVolume = settings.masterVolume;
                }
            }
        } catch (error) {
            console.warn('Error loading audio settings:', error);
        }
    }

    /**
     * Save audio settings to local storage
     */
    private static saveSettings(): void {
        try {
            const settings = {
                enabled: this.enabled,
                masterVolume: this.masterVolume,
            };

            localStorage.setItem('cyac_audio_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Error saving audio settings:', error);
        }
    }

    /**
     * Play a sound
     * @param id Unique identifier for the sound
     * @param src Source URL for the sound
     * @param options Playback options
     * @returns The audio element or null if playback failed
     */
    public static playSound(
        id: string,
        src: string,
        options: AudioOptions = {}
    ): HTMLAudioElement | null {
        // If not initialized, initialize first
        if (!this.initialized) {
            this.initialize();
        }

        // Check if audio is enabled
        if (!this.enabled) {
            return null;
        }

        // If we haven't detected user interaction yet, queue the sound
        if (!this.hasUserInteraction) {
            this.pendingSounds.push({ id, src, options });
            console.log(`Sound "${id}" queued for playback after user interaction`);
            return null;
        }

        // Set default options
        const {
            volume = 1,
            loop = false,
            autoplay = true,
            fadeIn = 0,
            fadeOut = 0
        } = options;

        // Store options for later use (especially for fadeOut)
        this.audioOptions.set(id, {
            ...options,
            volume, // Store normalized values
            loop,
            autoplay,
            fadeIn,
            fadeOut
        });

        // Stop any existing sound with the same ID
        this.stopSound(id);

        try {
            // Create a new audio element
            const audio = new Audio(src);

            // Set properties
            audio.volume = fadeIn > 0 ? 0 : volume * this.masterVolume;
            audio.loop = loop;

            // Store the audio element
            this.audioElements.set(id, audio);

            // Apply fade in if specified
            if (fadeIn > 0 && autoplay) {
                this.fadeIn(audio, volume * this.masterVolume, fadeIn);
            }

            // Play the audio if autoplay is enabled
            if (autoplay) {
                audio.play().catch(error => {
                    console.error(`Error playing sound "${id}":`, error);
                    this.audioElements.delete(id);
                    this.audioOptions.delete(id);
                });
            }

            return audio;
        } catch (error) {
            console.error(`Error creating sound "${id}":`, error);
            this.audioOptions.delete(id);
            return null;
        }
    }

    /**
     * Stop a sound
     * @param id Sound identifier
     * @param useFadeOut Whether to fade out before stopping
     * @returns Whether the sound was successfully stopped
     */
    public static stopSound(id: string, useFadeOut: boolean = false): boolean {
        const audio = this.audioElements.get(id);

        if (!audio) {
            return false;
        }

        // Get stored options
        const options = this.audioOptions.get(id);

        // Determine if we should fade out
        const shouldFadeOut = useFadeOut && options?.fadeOut && options.fadeOut > 0;

        if (shouldFadeOut) {
            const fadeOutDuration = options.fadeOut || 0;
            this.fadeOut(audio, fadeOutDuration, () => {
                audio.pause();
                audio.currentTime = 0;
                this.audioElements.delete(id);
                this.audioOptions.delete(id);
            });
        } else {
            audio.pause();
            audio.currentTime = 0;
            this.audioElements.delete(id);
            this.audioOptions.delete(id);
        }

        return true;
    }

    /**
     * Stop all sounds
     * @param useFadeOut Whether to fade out before stopping
     */
    public static stopAllSounds(useFadeOut: boolean = false): void {
        for (const [id] of this.audioElements) {
            this.stopSound(id, useFadeOut);
        }
    }

    /**
     * Toggle audio enabled state
     * @returns New enabled state
     */
    public static toggleEnabled(): boolean {
        this.enabled = !this.enabled;

        if (!this.enabled) {
            this.stopAllSounds();
        }

        this.saveSettings();
        return this.enabled;
    }

    /**
     * Set the master volume
     * @param volume New master volume (0 to 1)
     */
    public static setMasterVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));

        // Update volume for all playing sounds
        for (const [id, audio] of this.audioElements.entries()) {
            // Get the original volume from stored options
            const options = this.audioOptions.get(id) || {};
            const originalVolume = options?.volume || 1;
            audio.volume = originalVolume * this.masterVolume;
        }

        this.saveSettings();
    }

    /**
     * Fade in an audio element
     * @param audio Audio element to fade in
     * @param targetVolume Target volume after fade in
     * @param duration Fade duration in milliseconds
     */
    private static fadeIn(audio: HTMLAudioElement, targetVolume: number, duration: number): void {
        // Start from zero volume
        audio.volume = 0;

        const startTime = performance.now();

        const updateVolume = () => {
            const currentTime = performance.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            audio.volume = targetVolume * progress;

            if (progress < 1) {
                // Continue fading
                requestAnimationFrame(updateVolume);
            }
        };

        // Start fade in animation
        requestAnimationFrame(updateVolume);
    }

    /**
     * Fade out an audio element
     * @param audio Audio element to fade out
     * @param duration Fade duration in milliseconds
     * @param callback Callback to run after fade out
     */
    private static fadeOut(audio: HTMLAudioElement, duration: number, callback?: () => void): void {
        const startVolume = audio.volume;
        const startTime = performance.now();

        const updateVolume = () => {
            const currentTime = performance.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            audio.volume = startVolume * (1 - progress);

            if (progress < 1) {
                // Continue fading
                requestAnimationFrame(updateVolume);
            } else if (callback) {
                // Execute callback after fade out
                callback();
            }
        };

        // Start fade out animation
        requestAnimationFrame(updateVolume);
    }

    /**
     * Check if a sound is currently playing
     * @param id Sound identifier
     * @returns Whether the sound is playing
     */
    public static isPlaying(id: string): boolean {
        const audio = this.audioElements.get(id);
        return !!audio && !audio.paused;
    }

    /**
     * Play all pending sounds
     * Called after user interaction is detected
     * @private
     */
    private static playPendingSounds(): void {
        if (this.pendingSounds.length === 0) return;

        console.log(`Playing ${this.pendingSounds.length} pending sounds`);

        // Play each pending sound
        for (const { id, src, options } of this.pendingSounds) {
            this.playSound(id, src, options);
        }

        // Clear the queue
        this.pendingSounds = [];
    }

    /**
     * Check if audio is enabled
     * @returns Whether audio is enabled
     */
    public static isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Get the current master volume
     * @returns Current master volume
     */
    public static getMasterVolume(): number {
        return this.masterVolume;
    }

    /**
     * Preload a sound for later use (avoid playback delay)
     * @param id Sound identifier
     * @param src Sound source URL
     */
    public static preloadSound(id: string, src: string): void {
        if (!this.initialized) {
            this.initialize();
        }

        try {
            const audio = new Audio();
            audio.src = src;
            audio.preload = 'auto';

            // Store for later use
            this.audioElements.set(`preload_${id}`, audio);

            // Load the audio
            audio.load();

            console.log(`Preloaded sound "${id}"`);
        } catch (error) {
            console.warn(`Failed to preload sound "${id}":`, error);
        }
    }
}