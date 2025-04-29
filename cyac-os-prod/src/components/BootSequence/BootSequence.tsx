import React, {JSX, useEffect, useRef, useState} from 'react';
import styles from './BootSequence.module.css';
import {AudioManager} from '../../services/AudioManager';

interface BootSequenceProps {
    onComplete: () => void;
}

// Generate random memory addresses
const generateHexAddress = () => {
    return '0x' + Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0').toUpperCase();
};

// Generate random PIDs
const generatePID = () => {
    return Math.floor(Math.random() * 50000).toString();
};

const CyberAcmeBootProgress: React.FC<BootSequenceProps> = ({ onComplete }) => {
    const [logLines, setLogLines] = useState<JSX.Element[]>([]);
    const [bootComplete, setBootComplete] = useState(false);
    const [showProgress, setShowProgress] = useState(false);
    const [progressType, setProgressType] = useState('');
    const [progressValue, setProgressValue] = useState(0);
    const [_progressMaxValue, setProgressMaxValue] = useState(100);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // System paths for debug logs
    const systemPaths = [
        '/SYSTEM/LIB/CYAC_CORE.SO',
        '/SYSTEM/LIB/CYAC_QUANTUM.SO',
        '/SYSTEM/LIB/CYAC_NEUROLINK.SO',
        '/SYSTEM/FRAMEWORK/CYAC_SERVICES.JAR',
        '/SYSTEM/FRAMEWORK/CYBERACME_OS.JAR',
        '/DATA/LOCAL/TMP/CYAC_CONFIG.BIN',
        '/DATA/DATA/COM.CYBERACME.SYSTEM/FILES',
        '/DEV/QUANTUM',
        '/DEV/NEUROLINK',
        '/PROC/SYS/CYAC/RANDOM/UUID',
    ];

    // System components
    const systemComponents = [
        'QUANTUMPROCESSOR',
        'NEUROSYNCSERVICE',
        'BIOAUTHSERVICE',
        'HOLOGRAPHICDISPLAYSERVICE',
        'QUANTUMNETWORKSERVICE',
        'AIASSISTANTSERVICE',
        'VIRTUALREALITYSERVICE',
        'BIOMETRICSSERVICE',
        'QUANTUMENCRYPTIONSERVICE',
        'NANOBOTCONTROLSERVICE',
        'BRAINWAVEINTERFACESERVICE',
    ];

    // Helper function to create a delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper function to ensure auto-scrolling
    const scrollToBottom = () => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    };

    // Create a colored log line element
    const createLogLine = (lineType: string, content: string) => {
        let className;

        switch(lineType) {
            case '[D]':
                className = styles.debugLog;
                break;
            case '[E]':
                className = styles.errorLog;
                break;
            case '[I]':
                className = styles.infoLog;
                break;
            case '[S]':
                className = styles.systemLog;
                break;
            case '[W]':
                className = styles.warningLog;
                break;
            case '[V]':
                className = styles.verboseLog;
                break;
            default:
                className = styles.defaultLog;
        }

        return <div key={Math.random()} className={`${styles.logLine} ${className}`}>{content}</div>;
    };

    // Generate a register dump line
    const generateRegisterDump = () => {
        return `R0 ${generateHexAddress()} R1 ${generateHexAddress()} R2 ${generateHexAddress()} R3 ${generateHexAddress()} R4 ${generateHexAddress()} R5 ${generateHexAddress()} R6 ${generateHexAddress()} R7 ${generateHexAddress()}`;
    };

    // Generate a backtrace log
    const generateBacktrace = (logType: string, timestamp: string) => {
        const lines = [];

        lines.push(createLogLine(logType, `${logType} ${timestamp}: BACKTRACE:`));
        lines.push(createLogLine('', `    #00 PC ${generateHexAddress()} ${systemPaths[Math.floor(Math.random() * systemPaths.length)]}`));
        lines.push(createLogLine('', `    #01 PC ${generateHexAddress()} ${systemPaths[Math.floor(Math.random() * systemPaths.length)]}`));

        return lines;
    };

    // Generate a starting service log
    const generateServiceLog = (logType: string, timestamp: string, service: string) => {
        return createLogLine(logType, `${logType} ${timestamp}: STARTING SERVICE: INTENT { ACT=CYBERACME.INTENT.ACTION.MAIN CAT=[CYBERACME.INTENT.CATEGORY.SYSTEM] FLG=0X10000000 PKG=COM.CYBERACME.${service} }`);
    };

    // Generate an initializing log
    const generateInitLog = (logType: string, timestamp: string, service: string) => {
        const major = Math.floor(Math.random() * 10);
        const minor = Math.floor(Math.random() * 20);
        const patch = Math.floor(Math.random() * 100);

        return createLogLine(logType, `${logType} ${timestamp}: INITIALIZING ${service} WITH VERSION ${major}.${minor}.${patch}`);
    };

    // Generate a resource loading log
    const generateResourceLog = (logType: string, timestamp: string) => {
        const path = systemPaths[Math.floor(Math.random() * systemPaths.length)];
        const memSize = Math.floor(Math.random() * 100);

        return createLogLine(logType, `${logType} ${timestamp}: LOADING RESOURCE: ${path} [MEM: ${memSize}MB]`);
    };

    // Generate a PID log
    const generatePidLog = (logType: string, timestamp: string, service: string) => {
        const pid = generatePID();

        const logLine = createLogLine(logType, `${logType} ${timestamp}: PID: ${pid}, TID: ${pid}, NAME: .${service}. >>> CYBERACME_SYSTEM <<<`);
        const registerLine = createLogLine('', generateRegisterDump());

        return [logLine, registerLine];
    };

    // Progress bar update with fixed design to match screenshots
    const runProgressBar = async (type: string, targetPercent: number, startMsg: string, completeMsg: string, stalled: boolean = false) => {
        // Add start message
        setLogLines(prev => {
            const newLines = [...prev, createLogLine('[I]', `[I] (${Math.floor(Math.random() * 100000)}): ${startMsg}`)];
            setTimeout(scrollToBottom, 50);
            return newLines;
        });

        await delay(300);

        setLogLines(prev => {
            const newLines = [...prev, createLogLine('[I]', `[I] (${Math.floor(Math.random() * 100000)}): ${startMsg}`)];
            setTimeout(scrollToBottom, 50);
            return newLines;
        });

        // Show progress bar
        setProgressType(type);
        setProgressValue(0);
        setProgressMaxValue(100);
        setShowProgress(true);

        // Update progress in steps
        const steps = 20;
        const increment = targetPercent / steps;

        for (let i = 0; i <= steps; i++) {
            setProgressValue(Math.min(Math.floor(i * increment), targetPercent));
            await delay(100);
        }

        // Show some processing logs during the progress
        await delay(500);
        const timestamp = `(${Math.floor(Math.random() * 100000)})`;
        setLogLines(prev => {
            const newLines = [...prev, createLogLine('[D]', `[D] ${timestamp}: CHECKING ${type} INTEGRITY...`)];
            setTimeout(scrollToBottom, 50);
            return newLines;
        });

        await delay(200);

        setLogLines(prev => {
            const newLines = [...prev, createLogLine('[D]', `[D] (${Math.floor(Math.random() * 100000)}): CHECKING ${type} INTEGRITY...`)];
            setTimeout(scrollToBottom, 50);
            return newLines;
        });

        await delay(700);
        const timestamp2 = `(${Math.floor(Math.random() * 100000)})`;
        setLogLines(prev => {
            const newLines = [...prev, createLogLine('[S]', `[S] ${timestamp2}: VALIDATING ${type} CONFIGURATION...`)];
            setTimeout(scrollToBottom, 50);
            return newLines;
        });

        await delay(200);

        setLogLines(prev => {
            const newLines = [...prev, createLogLine('[S]', `[S] (${Math.floor(Math.random() * 100000)}): VALIDATING ${type} CONFIGURATION...`)];
            setTimeout(scrollToBottom, 50);
            return newLines;
        });

        // If stalled, show warning and keep the progress bar at the target percentage
        if (stalled) {
            await delay(800);
            const timestamp3 = `(${Math.floor(Math.random() * 100000)})`;
            setLogLines(prev => {
                const newLines = [...prev, createLogLine('[W]', `[W] ${timestamp3}: ${type} SCAN STALLED AT ${targetPercent}%`)];
                setTimeout(scrollToBottom, 50);
                return newLines;
            });

            await delay(200);

            setLogLines(prev => {
                const newLines = [...prev, createLogLine('[W]', `[W] (${Math.floor(Math.random() * 100000)}): ${type} SCAN STALLED AT ${targetPercent}%`)];
                setTimeout(scrollToBottom, 50);
                return newLines;
            });

            await delay(900);
            const timestamp4 = `(${Math.floor(Math.random() * 100000)})`;
            setLogLines(prev => {
                const newLines = [...prev, createLogLine('[W]', `[W] ${timestamp4}: ATTEMPTING RETRY...`)];
                setTimeout(scrollToBottom, 50);
                return newLines;
            });

            await delay(200);

            setLogLines(prev => {
                const newLines = [...prev, createLogLine('[W]', `[W] (${Math.floor(Math.random() * 100000)}): ATTEMPTING RETRY...`)];
                setTimeout(scrollToBottom, 50);
                return newLines;
            });

            await delay(1000);
            const timestamp5 = `(${Math.floor(Math.random() * 100000)})`;
            setLogLines(prev => {
                const newLines = [...prev, createLogLine('[I]', `[I] ${timestamp5}: ALTERNATIVE ${type} VERIFICATION METHOD INITIALIZING`)];
                setTimeout(scrollToBottom, 50);
                return newLines;
            });

            await delay(1200);
            const timestamp6 = `(${Math.floor(Math.random() * 100000)})`;
            setLogLines(prev => {
                const newLines = [...prev, createLogLine('[S]', `[S] ${timestamp6}: VERIFICATION COMPLETED USING FALLBACK METHOD`)];
                setTimeout(scrollToBottom, 50);
                return newLines;
            });
        } else {
            // Complete the progress to 100% if not stalled
            for (let i = 1; i <= (100 - targetPercent) / 5; i++) {
                setProgressValue(Math.min(targetPercent + (i * 5), 100));
                await delay(50);
            }

            await delay(800);
            const timestamp3 = `(${Math.floor(Math.random() * 100000)})`;
            setLogLines(prev => {
                const newLines = [...prev, createLogLine('[D]', `[D] ${timestamp3}: ${type} CHECK: COMPLETE`)];
                setTimeout(scrollToBottom, 50);
                return newLines;
            });
        }

        // Hide progress bar after completion
        await delay(1000);
        setShowProgress(false);

        // Add completion message
        setLogLines(prev => {
            const newLines = [...prev, createLogLine('[I]', `[I] (${Math.floor(Math.random() * 100000)}): ${completeMsg}`)];
            setTimeout(scrollToBottom, 50);
            return newLines;
        });
    };

    // Simulate boot process
    useEffect(() => {
        const runBootSequence = async () => {
            // Play boot sound
            try {
                AudioManager.playSound('bootSound', '/sounds/boot.mp3', {
                    volume: 0.3,
                    loop: false
                });
            } catch (error) {
                console.warn('Failed to play boot sound:', error);
            }

            // Add initial boot messages
            const initialLogs = [
                createLogLine('[I]', '[I] (10001): CYAC BIOS V2.5.7'),
                createLogLine('[I]', '[I] (10002): COPYRIGHT (C) 2025 CYBERACME CORPORATION'),
                createLogLine('[I]', '[I] (10003): INITIALIZING SYSTEM...'),
                createLogLine('[I]', '[I] (10004): CPU: CYAC QUANTUM CORE I9 @ 5.2GHZ'),
                createLogLine('[I]', '[I] (10005): MEMORY: 64GB CYAC DDR5 QUANTUM RAM'),
                createLogLine('[I]', '[I] (10006): STORAGE: 2TB CYAC NEOFLASH SSD'),
                createLogLine('[I]', '[I] (10007): INITIALIZING BOOT DIAGNOSTICS')
            ];

            setLogLines(initialLogs);
            setTimeout(scrollToBottom, 50);
            await delay(1000);

            // Run first progress bar - Security check that stalls at 40%
            await runProgressBar('SECURITY', 40, 'PERFORMING SECURITY SCAN...', 'SECURITY CHECK COMPLETED WITH 2 WARNINGS', true);
            await delay(500);

            // Run second progress bar - Filesystem check
            await runProgressBar('FILESYSTEM', 78, 'CHECKING FILESYSTEM INTEGRITY...', 'FILESYSTEM CHECK COMPLETED SUCCESSFULLY');
            await delay(500);

            // Run third progress bar - Network check
            await runProgressBar('NETWORK', 65, 'INITIALIZING QUANTUM NETWORK SUBSYSTEMS...', 'NETWORK SUBSYSTEMS INITIALIZED');
            await delay(500);

            // Generate main boot log sequence
            const generateMainLogs = () => {
                let logs = 0;
                const maxLogs = 100;

                const interval = setInterval(() => {
                    if (logs >= maxLogs) {
                        clearInterval(interval);

                        // Add boot complete message
                        const completeLogs = [
                            createLogLine('[I]', '[I] (19999): ============================================='),
                            createLogLine('[I]', '[I] (20000): BOOT COMPLETE - SYSTEM READY'),
                            createLogLine('[I]', '[I] (20001): ============================================='),
                        ];

                        setLogLines(prev => {
                            const newLines = [...prev, ...completeLogs];
                            setTimeout(scrollToBottom, 50);
                            return newLines;
                        });

                        // Complete boot sequence
                        setTimeout(() => {
                            setBootComplete(true);
                            setTimeout(onComplete, 1000);
                        }, 1500);

                        return;
                    }

                    // Generate random log entries
                    const batch: JSX.Element[] = [];
                    const batchSize = Math.floor(Math.random() * 3) + 1;

                    for (let i = 0; i < batchSize && logs < maxLogs; i++) {
                        const logTypes = ['[D]', '[E]', '[I]', '[S]', '[W]', '[V]'];
                        const logType = logTypes[Math.floor(Math.random() * logTypes.length)];
                        const timestamp = `(${Math.floor(Math.random() * 100000)})`;
                        const service = systemComponents[Math.floor(Math.random() * systemComponents.length)];

                        // Choose a random log type
                        const logVariant = Math.floor(Math.random() * 6);

                        switch(logVariant) {
                            case 0:
                                // Backtrace
                                batch.push(...generateBacktrace(logType, timestamp));
                                break;
                            case 1:
                                // Service start
                                batch.push(generateServiceLog(logType, timestamp, service));
                                break;
                            case 2:
                                // Init log
                                batch.push(generateInitLog(logType, timestamp, service));
                                break;
                            case 3:
                                // Resource loading
                                batch.push(generateResourceLog(logType, timestamp));
                                break;
                            case 4:
                                // PID info with register dump
                                batch.push(...generatePidLog(logType, timestamp, service));
                                break;
                            case 5:
                                // Memory allocation
                                const memSize = Math.floor(Math.random() * 100) + 10;
                                batch.push(createLogLine(logType, `${logType} ${timestamp}: LOADING RESOURCE: ${systemPaths[Math.floor(Math.random() * systemPaths.length)]} [MEM: ${memSize}MB]`));
                                break;
                        }

                        logs++;
                    }

                    setLogLines(prev => {
                        const newLines = [...prev, ...batch];
                        setTimeout(scrollToBottom, 50);
                        return newLines;
                    });
                }, 50);

                return () => clearInterval(interval);
            };

            // Start main boot log generation
            generateMainLogs();
        };

        // Start boot sequence
        runBootSequence().then(result => console.log(result));

        // Cleanup on unmount
        return () => {
            AudioManager.stopSound('bootSound');
        };
    }, [onComplete]);

    return (
        <div className={styles.bootSequence}>
            <header className={styles.bootHeader}>
                <div className={styles.companyName}>CYBERACME SYSTEMS</div>
                <div className={styles.biosVersion}>BIOS V2.5.7</div>
            </header>

            <div className={styles.bootContent}>
                <div className={styles.consoleContainer} ref={logContainerRef}>
                    {logLines}
                </div>

                {/* Fixed progress bar at bottom */}
                {showProgress && (
                    <div className={styles.progressBarFixed}>
                        <div className={styles.progressBarContent}>
                            <div className={styles.progressBarLabel}>
                                {progressType}:
                            </div>
                            <div className={styles.progressBarVisual}>
                                {`[${Array(Math.floor(20 * progressValue / 100)).fill('▮').join('')}${Array(20 - Math.floor(20 * progressValue / 100)).fill('▯').join('')}] ${progressValue}%`}
                            </div>
                        </div>
                    </div>
                )}

                {bootComplete && (
                    <div className={styles.bootComplete}>
                        <div className={styles.systemReady}>SYSTEM READY</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CyberAcmeBootProgress;