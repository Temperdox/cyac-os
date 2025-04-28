import React, { useState, useEffect, useRef } from 'react';
import styles from './Darknet.module.css';

const Darknet: React.FC = () => {
    const [terminalLines, setTerminalLines] = useState<string[]>([
        'ESTABLISHING SECURE CONNECTION...',
        'IDENTITY VERIFICATION PROTOCOLS BYPASSED',
        'WARNING: YOUR ACCESS IS BEING MONITORED',
        'BLACKMARKET ACCESS GRANTED - PROCEED WITH CAUTION'
    ]);

    const [currentInput, setCurrentInput] = useState<string>('');
    const [activeCategory, setActiveCategory] = useState<string>('');
    const terminalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Terminal effect: adds new lines over time
    useEffect(() => {
        const terminalInterval = setInterval(() => {
            // Random chance to add a new system message
            if (Math.random() < 0.1 && terminalLines.length < 12) {
                const possibleMessages = [
                    'SCANNING NETWORK FOR INTRUSION ATTEMPTS...',
                    'ENCRYPTED PACKET TRANSMISSION DETECTED',
                    'ROUTING THROUGH PROXY SERVERS...',
                    'SECURITY COUNTERMEASURES ACTIVE',
                    'DATA FRAGMENTATION PROTOCOLS ENGAGED',
                    'UNAUTHORIZED ACCESS ATTEMPT BLOCKED',
                    'NETWORK TOPOLOGY SHIFT COMPLETE',
                    'WARNING: CORPORATE SCANNER DETECTED'
                ];

                const newMessage = possibleMessages[Math.floor(Math.random() * possibleMessages.length)];
                setTerminalLines(prev => [...prev, newMessage]);
            }
        }, 5000);

        return () => clearInterval(terminalInterval);
    }, [terminalLines]);

    // Auto-focus the terminal input on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Auto-scroll terminal to bottom when new lines are added
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalLines]);

    // Handle terminal input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentInput(e.target.value);
    };

    const handleTerminalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentInput.trim()) return;

        setTerminalLines(prev => [...prev, `> ${currentInput}`]);

        // Process commands
        const command = currentInput.toLowerCase().trim();

        switch(command) {
            case 'help':
                setTimeout(() => {
                    setTerminalLines(prev => [...prev,
                        'AVAILABLE COMMANDS:',
                        '- help: Display available commands',
                        '- status: Check connection status',
                        '- clear: Clear terminal display',
                        '- browse: Access marketplace',
                        '- exit: Terminate connection'
                    ]);
                }, 300);
                break;

            case 'status':
                setTimeout(() => {
                    setTerminalLines(prev => [...prev,
                        'CONNECTION STATUS: SECURE',
                        'ENCRYPTION: 4096-BIT QUANTUM RESISTANT',
                        'ROUTE: BOUNCED THROUGH 17 PROXY SERVERS',
                        'CURRENT IDENTITY: ANONYMOUS',
                        'SECURITY LEVEL: MODERATE RISK'
                    ]);
                }, 300);
                break;

            case 'clear':
                setTimeout(() => {
                    setTerminalLines(['TERMINAL CLEARED', 'BLACKMARKET ACCESS ACTIVE']);
                }, 300);
                break;

            case 'browse':
                setTimeout(() => {
                    setTerminalLines(prev => [...prev, 'ACCESSING MARKETPLACE...']);
                }, 300);
                setTimeout(() => {
                    setActiveCategory('all');
                }, 800);
                break;

            case 'exit':
                setTimeout(() => {
                    setTerminalLines(prev => [...prev, 'TERMINATING CONNECTION...']);
                }, 300);
                setTimeout(() => {
                    setTerminalLines(['CONNECTION TERMINATED', 'PRESS ANY KEY TO RECONNECT']);
                    setActiveCategory('');
                }, 1500);
                break;

            default:
                setTimeout(() => {
                    setTerminalLines(prev => [...prev, 'COMMAND NOT RECOGNIZED. TYPE "help" FOR ASSISTANCE.']);
                }, 300);
        }

        setCurrentInput('');

        // Re-focus the input
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // Market data
    const marketItems = [
        {
            id: 1,
            name: 'Military-Grade Encryption Bypass',
            price: '¤ 45,000',
            description: 'Guaranteed access to encrypted military channels',
            category: 'security',
            seller: 'CipherWraith',
            rating: 4.7
        },
        {
            id: 2,
            name: 'Corporate Identity Package',
            price: '¤ 75,000',
            description: 'Complete identity with security clearance',
            category: 'identity',
            seller: 'PhantomFiles',
            rating: 4.9
        },
        {
            id: 3,
            name: 'Neural Jammers (3-pack)',
            price: '¤ 30,000',
            description: 'Blocks tracking signals from neural implants',
            category: 'hardware',
            seller: 'SynapseShadow',
            rating: 4.2
        },
        {
            id: 4,
            name: 'Memory Wipe Service',
            price: '¤ 120,000',
            description: 'Professional removal of specified memories',
            category: 'services',
            seller: 'NeuralVoid',
            rating: 4.8
        },
        {
            id: 5,
            name: 'Prototype Combat Enhancers',
            price: '¤ 85,000',
            description: 'Military-rejected reflex boosters, minimal side effects',
            category: 'hardware',
            seller: 'WarTech',
            rating: 3.9
        },
        {
            id: 6,
            name: 'Corporate Database Access',
            price: '¤ 55,000',
            description: 'One-time access to specified corporate database',
            category: 'data',
            seller: 'DataPhantom',
            rating: 4.5
        },
        {
            id: 7,
            name: 'Surveillance Evasion Suite',
            price: '¤ 62,000',
            description: 'Complete toolkit for avoiding detection systems',
            category: 'security',
            seller: 'GhostProtocol',
            rating: 4.6
        },
        {
            id: 8,
            name: 'Custom Cybernetic Mods',
            price: '¤ 95,000+',
            description: 'Unlicensed modifications for existing implants',
            category: 'hardware',
            seller: 'ChromeShifter',
            rating: 4.4
        }
    ];

    const filteredItems = activeCategory === 'all'
        ? marketItems
        : marketItems.filter(item => item.category === activeCategory);

    return (
        <div className={styles.darknetPage}>
            <header className={styles.header}>
                <h1>SEKIGUCHI DARKNET</h1>
                <div className={styles.subtitle}>UNDERGROUND NETWORK ACCESS</div>
            </header>

            <main className={styles.content}>
                <div className={styles.accessTerminal}>
                    <div className={styles.terminalHeader}>
                        SEKIGUCHI SECURE TERMINAL v3.7.2
                    </div>
                    <div className={styles.terminalContent} ref={terminalRef}>
                        {terminalLines.map((line, index) => (
                            <div key={index} className={styles.terminalLine}>
                                {line.startsWith('>') ? (
                                    <>{line}</>
                                ) : (
                                    <>
                                        <span className={styles.prompt}>&gt;</span> {line}
                                    </>
                                )}
                            </div>
                        ))}
                        <form onSubmit={handleTerminalSubmit} className={styles.terminalInputLine}>
                            <span className={styles.prompt}>&gt;</span>
                            <input
                                type="text"
                                value={currentInput}
                                onChange={handleInputChange}
                                className={styles.terminalInput}
                                ref={inputRef}
                                autoFocus
                                spellCheck="false"
                            />
                            <span className={styles.cursor}></span>
                        </form>
                    </div>
                </div>

                {activeCategory && (
                    <div className={styles.marketplaceSection}>
                        <div className={styles.marketHeader}>
                            <h2>SEKIGUCHI BLACK MARKET</h2>
                            <div className={styles.marketCategories}>
                                <button
                                    className={`${styles.categoryButton} ${activeCategory === 'all' ? styles.activeCategory : ''}`}
                                    onClick={() => setActiveCategory('all')}
                                >
                                    ALL
                                </button>
                                <button
                                    className={`${styles.categoryButton} ${activeCategory === 'hardware' ? styles.activeCategory : ''}`}
                                    onClick={() => setActiveCategory('hardware')}
                                >
                                    HARDWARE
                                </button>
                                <button
                                    className={`${styles.categoryButton} ${activeCategory === 'security' ? styles.activeCategory : ''}`}
                                    onClick={() => setActiveCategory('security')}
                                >
                                    SECURITY
                                </button>
                                <button
                                    className={`${styles.categoryButton} ${activeCategory === 'data' ? styles.activeCategory : ''}`}
                                    onClick={() => setActiveCategory('data')}
                                >
                                    DATA
                                </button>
                                <button
                                    className={`${styles.categoryButton} ${activeCategory === 'identity' ? styles.activeCategory : ''}`}
                                    onClick={() => setActiveCategory('identity')}
                                >
                                    IDENTITY
                                </button>
                                <button
                                    className={`${styles.categoryButton} ${activeCategory === 'services' ? styles.activeCategory : ''}`}
                                    onClick={() => setActiveCategory('services')}
                                >
                                    SERVICES
                                </button>
                            </div>
                        </div>

                        <div className={styles.marketGrid}>
                            {filteredItems.map(item => (
                                <div key={item.id} className={styles.marketItem}>
                                    <div className={styles.itemName}>{item.name}</div>
                                    <div className={styles.itemPrice}>{item.price}</div>
                                    <div className={styles.itemSeller}>
                                        Seller: {item.seller} | Rating: {item.rating}/5.0
                                    </div>
                                    <div className={styles.itemDescription}>{item.description}</div>
                                    <button className={styles.itemButton}>PURCHASE</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <footer className={styles.footer}>
                <div>SEKIGUCHI DARKNET • UNAUTHORIZED ACCESS IS MONITORED</div>
                <div className={styles.statusIndicator}>ENCRYPTED CONNECTION • PROXY ACTIVE</div>
            </footer>
        </div>
    );
};

// Export site data for the browser implementation
export const siteData = {
    id: 'darknet',
    name: 'SEKIGUCHI',
    url: 'darknet.cyb',
    isMobile: true,
    component: <Darknet />
};

export default Darknet;