import React, { useState, useEffect, useRef } from 'react';
import styles from './BootSequence.module.css';
import { AudioManager } from '../../services/AudioManager';

interface BootSequenceProps {
    onComplete: () => void;
}

const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
    // Boot sequence states
    const [bootPhase, setBootPhase] = useState<'off' | 'bios' | 'memory' | 'hardware' | 'os' | 'complete'>('off');
    const [messages, setMessages] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Add a boot message
    const addMessage = (message: string) => {
        setMessages(prev => [...prev, message]);
    };

    // Scroll to the latest message
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Run the boot sequence
    useEffect(() => {
        const runBootSequence = async () => {
            // Play boot sound
            try {
                // Use AudioManager instead of raw Audio object
                AudioManager.playSound('bootSound', '/sounds/boot.mp3', {
                    volume: 0.4,
                    fadeOut: 1000 // Enable fade out for later
                });
            } catch (error) {
                console.warn('Failed to play boot sound:', error);
            }

            // BIOS Phase
            setBootPhase('bios');
            addMessage('CYAC BIOS v2.5.7');
            await delay(500);
            addMessage('Copyright (C) 2025 CyberAcme Corporation');
            await delay(300);
            addMessage('Initializing System...');
            await delay(500);
            addMessage('CPU: CYAC Quantum Core i9 @ 5.2GHz');
            await delay(200);
            addMessage('Memory: 64GB CyAc DDR5 Quantum RAM');
            await delay(200);
            addMessage('Storage: 2TB CyAc NeoFlash SSD');
            await delay(300);

            // Memory Check Phase
            setBootPhase('memory');
            addMessage('Running Memory Diagnostic...');
            await delay(300);

            // Simulate memory test with progress updates
            const totalMemory = 64; // GB
            const memorySteps = 8;
            const stepSize = 100 / memorySteps;

            for (let i = 0; i < memorySteps; i++) {
                const currentBlock = (i + 1) * (totalMemory / memorySteps);
                addMessage(`Testing memory block: ${i * (totalMemory / memorySteps)}GB - ${currentBlock}GB`);

                // Update progress in smaller increments for smoother animation
                const baseProgress = i * stepSize;
                for (let j = 0; j <= 10; j++) {
                    setProgress(Math.floor(baseProgress + (j * (stepSize / 10))));
                    await delay(30);
                }
            }

            addMessage(`Memory test complete. ${totalMemory}GB RAM OK`);
            await delay(300);

            // Hardware Detection Phase
            setBootPhase('hardware');
            addMessage('Detecting hardware devices...');
            await delay(400);

            const devices = [
                'CyAc NeoDisplay XR5 Graphics Adapter',
                'CyAc Quantum Network Interface',
                'CyAc BioAuth Fingerprint Module',
                'CyAc NeuroSync Interface Controller'
            ];

            for (const device of devices) {
                addMessage(`Detected: ${device}`);
                await delay(200);
            }

            addMessage('Hardware initialization complete');
            await delay(300);

            // OS Boot Phase
            setBootPhase('os');
            addMessage('Booting CyberAcme OS v3.6.0...');
            await delay(400);
            setProgress(10);

            addMessage('Loading kernel modules...');
            await delay(300);
            setProgress(30);

            addMessage('Initializing file system...');
            await delay(250);
            setProgress(50);

            addMessage('Starting network services...');
            await delay(200);
            setProgress(65);

            addMessage('Initializing user interface...');
            await delay(350);
            setProgress(80);

            addMessage('Applying system configuration...');
            await delay(300);
            setProgress(95);

            addMessage('System initialization complete');
            await delay(200);
            setProgress(100);

            // Boot complete
            setBootPhase('complete');
            await delay(500);

            // Fade out boot sound
            AudioManager.stopSound('bootSound', true);

            // Play startup sound
            try {
                AudioManager.playSound('startupSound', '/sounds/startup.mp3', { volume: 0.5 });
            } catch (error) {
                console.warn('Failed to play startup sound:', error);
            }

            // Complete boot sequence
            await delay(1000);
            onComplete();
        };

        // Start boot sequence
        runBootSequence().then(() => {
            console.log('Boot sequence completed successfully.');
        }).catch(error => {
            console.error('An error occurred during the boot sequence:', error);
        });

        // Cleanup function
        return () => {
            AudioManager.stopSound('bootSound');
            AudioManager.stopSound('startupSound');
        };
    }, [onComplete]);

    // Helper function to create a delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Render based on boot phase
    return (
        <div className={styles.bootSequence}>
            {/* Rest of your component render code remains unchanged */}
            {bootPhase === 'off' && (
                <div className={styles.bootOff}></div>
            )}

            {bootPhase !== 'off' && bootPhase !== 'complete' && (
                <div className={styles.bootScreen}>
                    <div className={styles.bootHeader}>
                        <div className={styles.company}>CYBERACME SYSTEMS</div>
                        <div className={styles.biosVersion}>BIOS v2.5.7</div>
                    </div>

                    <div className={styles.bootContent}>
                        <div className={styles.messagesContainer}>
                            {messages.map((message, index) => (
                                <div key={index} className={styles.message}>
                                    {message}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {(bootPhase === 'memory' || bootPhase === 'os') && (
                            <div className={styles.progressContainer}>
                                <div className={styles.progressLabel}>
                                    {bootPhase === 'memory' ? 'Memory Test:' : 'Loading OS:'}
                                </div>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <div className={styles.progressPercentage}>{progress}%</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {bootPhase === 'complete' && (
                <div className={styles.bootComplete}>
                    <div className={styles.logoContainer}>
                        <div className={styles.logo}>CYBERACME OS</div>
                        <div className={styles.version}>v3.6.0</div>
                    </div>
                    <div className={styles.ready}>SYSTEM READY</div>
                </div>
            )}
        </div>
    );
};

export default BootSequence;