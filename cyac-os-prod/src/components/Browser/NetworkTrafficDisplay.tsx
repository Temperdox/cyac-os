import React, { useState, useEffect } from 'react';
import styles from './NetworkTrafficDisplay.module.css';

// Network traffic visualization component
const NetworkTrafficDisplay: React.FC = () => {
    const [inTraffic, setInTraffic] = useState<number[]>(Array(20).fill(0));
    const [outTraffic, setOutTraffic] = useState<number[]>(Array(20).fill(0));
    const [trafficEvent, setTrafficEvent] = useState<string>('Initial connection established');
    const [inRate, setInRate] = useState<string>('41KB/S');
    const [outRate, setOutRate] = useState<string>('21KB/S');

    // Network events to cycle through
    const networkEvents: string[] = [
        'Multi-spectrum signal analysis running',
        'MIDA feed synchronization active',
        'Neural protocol negotiation successful',
        'Quantum encryption layer engaged',
        'Darknet proxy tunneling enabled',
        'Neural interface calibration complete',
        'Biometric authentication verified'
    ];

    // Update traffic data periodically
    useEffect(() => {
        const interval = setInterval(() => {
            // Update IN traffic
            setInTraffic((prev) => {
                const newValues = [...prev];
                newValues.shift();
                newValues.push(Math.floor(Math.random() * 15) + 4);
                return newValues;
            });

            // Update OUT traffic
            setOutTraffic((prev) => {
                const newValues = [...prev];
                newValues.shift();
                newValues.push(Math.floor(Math.random() * 6) + 2);
                return newValues;
            });

            // Update the data rates
            const inKb = Math.floor(Math.random() * 400) + 300;
            const outKb = Math.floor(Math.random() * 100) + 10;
            setInRate(`${inKb}KB/S`);
            setOutRate(`${outKb}KB/S`);

            // Change the traffic event text randomly
            if (Math.random() > 0.7) {
                setTrafficEvent(networkEvents[Math.floor(Math.random() * networkEvents.length)]);
            }
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: 'auto',
            width: '350px'
        }}>
            {/* Network graph container */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {/* IN traffic - purple */}
                <div style={{
                    position: 'relative',
                    height: '15px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    width: '100%'
                }}>
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        color: '#bb86fc',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold'
                    }}>
                        IN
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        marginLeft: '25px',
                        width: 'calc(100% - 25px)',
                        height: '100%'
                    }}>
                        {inTraffic.map((value, index) => (
                            <div key={`in-${index}`} style={{
                                flexGrow: 1,
                                height: `${value * 6}%`,
                                backgroundColor: '#bb86fc',
                                margin: '0 1px',
                                maxHeight: '15px'
                            }} />
                        ))}
                    </div>
                </div>

                {/* OUT traffic - cyan */}
                <div style={{
                    position: 'relative',
                    height: '15px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    width: '100%',
                    marginTop: '2px'
                }}>
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        color: '#03dac6',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold'
                    }}>
                        OUT
                    </div>
                    <div style={{
                        display: 'flex',
                        marginLeft: '25px',
                        width: 'calc(100% - 25px)',
                        height: '100%'
                    }}>
                        {outTraffic.map((value, index) => (
                            <div key={`out-${index}`} style={{
                                flexGrow: 1,
                                height: `${value * 6}%`,
                                backgroundColor: '#03dac6',
                                margin: '0 1px',
                                maxHeight: '15px'
                            }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Network event text */}
            <div className={styles.eventTextContainer}>
                <span className={styles.eventDescription}>
                  {trafficEvent}
                </span>
                <span className={styles.eventRates}>
                  • {inRate} IN • {outRate} OUT
                </span>
            </div>
        </div>
    );
};

export default NetworkTrafficDisplay;