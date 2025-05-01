import { Level, GameConfig } from '../types';

/**
 * Load levels from JSON files
 * This function loads all level data from the Levels directory
 */
export const loadLevels = async (): Promise<Level[]> => {
    try {
        // For a real implementation, this would load JSON files from the file system
        // However, for this demo, we'll return hardcoded levels

        // In a real implementation with file access, this would be:
        // const levelFiles = await window.fs.readdir('/components/viewers/GameLauncher/Games/CyberQuest/Levels');
        // const levels = await Promise.all(
        //   levelFiles.map(async (file) => {
        //     const content = await window.fs.readFile(`/components/viewers/GameLauncher/Games/CyberQuest/Levels/${file}`, { encoding: 'utf8' });
        //     return JSON.parse(content);
        //   })
        // );

        // Since we don't have direct file access, we'll return sample levels
        return [
            {
                id: 'tutorial_01',
                name: 'System Basics',
                description: 'Learn the basics of cyber infiltration',
                difficulty: 'easy',
                type: 'puzzle',
                order: 1,
                data: {
                    intro: 'Welcome, agent. Your first task is to learn the basic controls and operations.',
                    outro: 'Well done! You now understand the fundamentals of the system.',
                    objectives: [
                        {
                            id: 'obj_1',
                            description: 'Connect to the terminal',
                            type: 'activate',
                            target: 'terminal',
                            points: 10
                        },
                        {
                            id: 'obj_2',
                            description: 'Execute first command',
                            type: 'hack',
                            target: 'command_prompt',
                            points: 20
                        },
                        {
                            id: 'obj_3',
                            description: 'Download training data',
                            type: 'collect',
                            target: 'data_01',
                            points: 30
                        }
                    ]
                },
                maxScore: 100,
                timeLimit: 180,
                rewards: {
                    points: 50,
                    bonusPoints: 25,
                    experience: 100
                }
            },
            {
                id: 'decryption_01',
                name: 'Basic Decryption',
                description: 'Decrypt a simple cipher to gain access to secured data',
                difficulty: 'easy',
                type: 'decryption',
                order: 2,
                data: {
                    intro: 'This server is protected with a simple Caesar cipher. Decrypt the password to gain access.',
                    outro: 'Excellent work! The encryption was no match for your skills.',
                    backgroundImage: 'decryption_bg.jpg',
                    ambientSound: 'server_room.mp3',
                    objectives: [
                        {
                            id: 'obj_1',
                            description: 'Identify the cipher type',
                            type: 'solve',
                            target: 'cipher_type',
                            points: 30
                        },
                        {
                            id: 'obj_2',
                            description: 'Decode the key',
                            type: 'solve',
                            target: 'decrypt_key',
                            points: 50
                        },
                        {
                            id: 'obj_3',
                            description: 'Access the secured database',
                            type: 'hack',
                            target: 'secure_db',
                            points: 70
                        }
                    ]
                },
                maxScore: 200,
                timeLimit: 300,
                miniGames: [
                    {
                        id: 'cipher_game',
                        type: 'password_crack',
                        data: {
                            cipher: 'Caesar',
                            shift: 3,
                            password: 'SECUREACCESS'
                        },
                        rewards: {
                            points: 50
                        }
                    }
                ],
                rewards: {
                    points: 100,
                    bonusPoints: 50,
                    experience: 150,
                    unlocks: ['maze_01']
                },
                requirements: {
                    completedLevels: ['tutorial_01']
                }
            },
            {
                id: 'maze_01',
                name: 'Network Maze',
                description: 'Navigate through a complex network structure to access the central server',
                difficulty: 'normal',
                type: 'maze',
                order: 3,
                data: {
                    intro: 'This network is structured like a maze. Find the path to the central server while avoiding detection.',
                    outro: "Impressive navigation skills! You've reached the central server undetected.",
                    gridSize: { width: 10, height: 10 },
                    entityData: [
                        {
                            id: 'player_start',
                            type: 'player',
                            position: { x: 0, y: 0 }
                        },
                        {
                            id: 'goal',
                            type: 'server',
                            position: { x: 9, y: 9 }
                        },
                        {
                            id: 'firewall_1',
                            type: 'firewall',
                            position: { x: 2, y: 3 }
                        }
                    ],
                    objectives: [
                        {
                            id: 'obj_1',
                            description: 'Map the network layout',
                            type: 'solve',
                            target: 'map_complete',
                            points: 50
                        },
                        {
                            id: 'obj_2',
                            description: 'Bypass firewalls',
                            type: 'hack',
                            target: 'firewall_bypass',
                            points: 75
                        },
                        {
                            id: 'obj_3',
                            description: 'Reach the central server',
                            type: 'reach',
                            target: 'central_server',
                            points: 100
                        }
                    ]
                },
                maxScore: 300,
                timeLimit: 600,
                rewards: {
                    points: 150,
                    bonusPoints: 75,
                    experience: 200,
                    items: ['tool_network_analyzer']
                },
                requirements: {
                    completedLevels: ['decryption_01'],
                    playerLevel: 2
                }
            },
            {
                id: 'stealth_01',
                name: 'Stealth Infiltration',
                description: 'Infiltrate the system without triggering any security alerts',
                difficulty: 'hard',
                type: 'stealth',
                order: 4,
                data: {
                    intro: 'This high-security system has multiple detection mechanisms. Move carefully to avoid triggering any alarms.',
                    outro: 'Perfect stealth operation! No one will ever know you were here.',
                    entityData: [
                        {
                            id: 'security_cam_1',
                            type: 'camera',
                            position: { x: 3, y: 5 },
                            properties: {
                                rotation: 45,
                                detectionRadius: 4
                            }
                        },
                        {
                            id: 'security_cam_2',
                            type: 'camera',
                            position: { x: 8, y: 2 },
                            properties: {
                                rotation: 270,
                                detectionRadius: 4
                            }
                        },
                        {
                            id: 'guard_1',
                            type: 'guard',
                            position: { x: 5, y: 7 },
                            properties: {
                                patrolPath: [
                                    { x: 5, y: 7 },
                                    { x: 9, y: 7 },
                                    { x: 9, y: 3 },
                                    { x: 5, y: 3 }
                                ]
                            }
                        }
                    ],
                    objectives: [
                        {
                            id: 'obj_1',
                            description: 'Disable security cameras',
                            type: 'hack',
                            target: 'security_cameras',
                            points: 100
                        },
                        {
                            id: 'obj_2',
                            description: 'Access the mainframe without detection',
                            type: 'hack',
                            target: 'mainframe',
                            points: 150
                        },
                        {
                            id: 'obj_3',
                            description: 'Extract confidential data',
                            type: 'collect',
                            target: 'confidential_data',
                            points: 200
                        }
                    ]
                },
                maxScore: 500,
                timeLimit: 900,
                rewards: {
                    points: 250,
                    bonusPoints: 125,
                    experience: 300,
                    items: ['upgrade_stealth_module']
                },
                requirements: {
                    completedLevels: ['maze_01'],
                    playerLevel: 3
                }
            },
            {
                id: 'hacking_01',
                name: 'Corporate Backdoor',
                description: 'Find and exploit a backdoor in the corporate security system',
                difficulty: 'hard',
                type: 'hacking',
                order: 5,
                data: {
                    intro: 'This corporation has a hidden backdoor in their security system. Find it and exploit it to gain access.',
                    outro: "Impressive! You've successfully exploited the backdoor and gained full access to their systems.",
                    objectives: [
                        {
                            id: 'obj_1',
                            description: 'Scan for vulnerabilities',
                            type: 'hack',
                            target: 'vulnerability_scan',
                            points: 100
                        },
                        {
                            id: 'obj_2',
                            description: 'Identify the backdoor',
                            type: 'find',
                            target: 'backdoor_location',
                            points: 150
                        },
                        {
                            id: 'obj_3',
                            description: 'Exploit the vulnerability',
                            type: 'hack',
                            target: 'exploit_backdoor',
                            points: 200
                        },
                        {
                            id: 'obj_4',
                            description: 'Cover your tracks',
                            type: 'hack',
                            target: 'clean_logs',
                            points: 100
                        }
                    ]
                },
                maxScore: 600,
                timeLimit: 1200,
                miniGames: [
                    {
                        id: 'vulnerability_scanner',
                        type: 'pattern_match',
                        data: {
                            patterns: ['0xF7A4', '0xC3B2', '0xE9D1'],
                            targetPattern: '0xF7A4'
                        },
                        rewards: {
                            points: 75
                        }
                    },
                    {
                        id: 'backdoor_exploit',
                        type: 'wire_connect',
                        data: {
                            wires: 8,
                            solution: [
                                { from: 1, to: 5 },
                                { from: 2, to: 7 },
                                { from: 3, to: 8 },
                                { from: 4, to: 6 }
                            ]
                        },
                        rewards: {
                            points: 125
                        }
                    }
                ],
                rewards: {
                    points: 300,
                    bonusPoints: 150,
                    experience: 400,
                    items: ['tool_log_cleaner']
                },
                requirements: {
                    completedLevels: ['stealth_01'],
                    playerLevel: 5
                }
            }
        ];
    } catch (error) {
        console.error('Failed to load levels:', error);
        throw new Error('Failed to load game levels');
    }
};

/**
 * Load game configuration data
 */
export const loadGameConfig = async (): Promise<GameConfig> => {
    try {
        // For a real implementation with file access:
        // const configContent = await window.fs.readFile('/components/viewers/GameLauncher/Games/CyberQuest/config.json', { encoding: 'utf8' });
        // return JSON.parse(configContent);

        // Sample configuration
        return {
            version: '1.0.0',
            settings: {
                defaultDifficulty: 'normal',
                pointsMultiplier: 1,
                experienceMultiplier: 1,
                timeLimit: 600
            },
            shopItems: [
                {
                    id: 'tool_advanced_scanner',
                    name: 'Advanced Scanner',
                    description: 'Reveals hidden elements and vulnerabilities in systems',
                    type: 'tool',
                    price: 200,
                    rarity: 'uncommon',
                    effects: [
                        {
                            type: 'reveal_path',
                            value: 'hidden_elements'
                        }
                    ],
                    image: '/images/items/advanced_scanner.png'
                },
                {
                    id: 'powerup_time_warp',
                    name: 'Time Warp',
                    description: 'Slows down time, giving you more time to solve puzzles',
                    type: 'powerup',
                    price: 350,
                    rarity: 'rare',
                    effects: [
                        {
                            type: 'time_slow',
                            value: 0.5,
                            duration: 30
                        }
                    ],
                    image: '/images/items/time_warp.png'
                },
                {
                    id: 'upgrade_neural_interface',
                    name: 'Neural Interface',
                    description: 'Enhances hacking speed and provides occasional hints',
                    type: 'upgrade',
                    price: 500,
                    rarity: 'epic',
                    effects: [
                        {
                            type: 'speed_boost',
                            value: 1.5
                        },
                        {
                            type: 'hint',
                            value: 'periodic'
                        }
                    ],
                    image: '/images/items/neural_interface.png'
                },
                {
                    id: 'cosmetic_elite_hacker',
                    name: 'Elite Hacker Theme',
                    description: 'A sleek, dark theme for the true hacking professional',
                    type: 'cosmetic',
                    price: 150,
                    rarity: 'uncommon',
                    effects: [
                        {
                            type: 'custom',
                            value: 'elite_hacker_theme'
                        }
                    ],
                    image: '/images/items/elite_hacker_theme.png'
                },
                {
                    id: 'tool_auto_decryptor',
                    name: 'Auto-Decryptor',
                    description: 'Automatically solves simple decryption puzzles',
                    type: 'tool',
                    price: 750,
                    rarity: 'epic',
                    effects: [
                        {
                            type: 'auto_solve',
                            value: 'simple_decryption'
                        }
                    ],
                    image: '/images/items/auto_decryptor.png',
                    unlockRequirement: {
                        type: 'level',
                        value: 5
                    }
                },
                {
                    id: 'powerup_firewall_breaker',
                    name: 'Firewall Breaker',
                    description: 'One-time use tool that instantly bypasses a firewall',
                    type: 'powerup',
                    price: 300,
                    rarity: 'rare',
                    effects: [
                        {
                            type: 'custom',
                            value: 'bypass_firewall'
                        }
                    ],
                    image: '/images/items/firewall_breaker.png'
                },
                {
                    id: 'upgrade_score_amplifier',
                    name: 'Score Amplifier',
                    description: 'Permanently increases all points earned by 10%',
                    type: 'upgrade',
                    price: 1000,
                    rarity: 'legendary',
                    effects: [
                        {
                            type: 'score_multiplier',
                            value: 1.1
                        }
                    ],
                    image: '/images/items/score_amplifier.png',
                    unlockRequirement: {
                        type: 'achievement',
                        value: 'cyberquest_level5'
                    }
                }
            ],
            enemies: [
                {
                    id: 'security_drone',
                    name: 'Security Drone',
                    type: 'patrol',
                    health: 50,
                    damage: 10,
                    speed: 2,
                    detectionRadius: 4,
                    abilities: ['scan', 'alert']
                },
                {
                    id: 'firewall',
                    name: 'Adaptive Firewall',
                    type: 'static',
                    health: 100,
                    damage: 25,
                    speed: 0,
                    detectionRadius: 2,
                    abilities: ['block', 'countermeasure']
                },
                {
                    id: 'ai_guardian',
                    name: 'AI Guardian',
                    type: 'hunter',
                    health: 200,
                    damage: 40,
                    speed: 3,
                    detectionRadius: 6,
                    abilities: ['trace', 'lockdown', 'analyze']
                }
            ],
            powerups: [
                {
                    id: 'speed_boost',
                    name: 'Acceleration Module',
                    description: 'Temporarily increases movement and hacking speed',
                    duration: 30,
                    effect: {
                        type: 'speed_boost',
                        value: 2
                    },
                    image: '/images/powerups/speed_boost.png'
                },
                {
                    id: 'invisibility',
                    name: 'Stealth Protocol',
                    description: 'Makes you invisible to security systems for a short time',
                    duration: 15,
                    effect: {
                        type: 'custom',
                        value: 'invisibility'
                    },
                    image: '/images/powerups/invisibility.png'
                },
                {
                    id: 'shield',
                    name: 'Defensive Subroutine',
                    description: 'Protects against damage from security systems',
                    duration: 20,
                    effect: {
                        type: 'custom',
                        value: 'damage_shield'
                    },
                    image: '/images/powerups/shield.png'
                }
            ],
            themes: [
                {
                    id: 'default',
                    name: 'Default',
                    description: 'The standard CyberQuest interface',
                    primaryColor: '#33ffff',
                    secondaryColor: '#ff33ff',
                    backgroundColor: '#0a0a1a',
                    fontFamily: 'Courier New, monospace'
                },
                {
                    id: 'retro',
                    name: 'Retro Terminal',
                    description: 'Classic green-on-black terminal style',
                    primaryColor: '#33ff33',
                    secondaryColor: '#aaff33',
                    backgroundColor: '#000000',
                    fontFamily: 'VT323, monospace',
                    unlockRequirement: {
                        type: 'level',
                        value: 3
                    }
                },
                {
                    id: 'neon',
                    name: 'Neon City',
                    description: 'Vibrant neon cyberpunk aesthetic',
                    primaryColor: '#ff00ff',
                    secondaryColor: '#00ffff',
                    backgroundColor: '#120b1e',
                    fontFamily: 'Orbitron, sans-serif',
                    unlockRequirement: {
                        type: 'points',
                        value: 1000
                    }
                }
            ]
        };
    } catch (error) {
        console.error('Failed to load game config:', error);
        throw new Error('Failed to load game configuration');
    }
};