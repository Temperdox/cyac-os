import React, { useState } from 'react';
import styles from './InfoStream.module.css';

const InfoStream: React.FC = () => {
    const [activeProject, setActiveProject] = useState<string | null>(null);

    const toggleProject = (projectName: string) => {
        if (activeProject === projectName) {
            setActiveProject(null);
        } else {
            setActiveProject(projectName);
        }
    };

    return (
        <div className={styles.infoStreamPage}>
            <header className={styles.header}>
                <h1>NU RESEARCH DIVISION</h1>
                <div className={styles.subtitle}>REAL-TIME INFORMATION GRID</div>
            </header>

            <main className={styles.content}>
                <div className={styles.dataPanel}>
                    <h2>CURRENT RESEARCH INITIATIVES</h2>
                    <ul className={styles.dataList}>
                        <li
                            className={activeProject === 'HARMONY' ? styles.activeProject : ''}
                            onClick={() => toggleProject('HARMONY')}
                        >
                            <div className={styles.projectHeader}>
                                <span className={styles.projectName}>Project HARMONY</span>
                                <span className={styles.projectStatus}>STATUS: ACTIVE</span>
                            </div>
                            <p className={styles.projectSummary}>Neural interface optimization for extended consciousness transfer</p>
                            {activeProject === 'HARMONY' && (
                                <div className={styles.projectDetails}>
                                    <p>Classification Level: ULTRAVIOLET</p>
                                    <p>Lead Researcher: Dr. Eliza Morgan</p>
                                    <p>Progress: 73% of primary objectives achieved</p>
                                    <p>Current Phase: Neural pathway synchronization trials on volunteer subjects</p>
                                    <p>Notes: Subjects 12-17 showing promising results with minimal cognitive degradation.
                                        Memory retention has improved from 56% to 89% after implementation of quantum buffer protocol.</p>
                                </div>
                            )}
                        </li>
                        <li
                            className={activeProject === 'ORACLE' ? styles.activeProject : ''}
                            onClick={() => toggleProject('ORACLE')}
                        >
                            <div className={styles.projectHeader}>
                                <span className={styles.projectName}>Project ORACLE</span>
                                <span className={styles.projectStatus}>STATUS: PHASE 2</span>
                            </div>
                            <p className={styles.projectSummary}>Predictive algorithms for market manipulation and social engineering</p>
                            {activeProject === 'ORACLE' && (
                                <div className={styles.projectDetails}>
                                    <p>Classification Level: INDIGO</p>
                                    <p>Lead Researcher: Dr. Marcus Chen</p>
                                    <p>Progress: 58% of primary objectives achieved</p>
                                    <p>Current Phase: Limited deployment in controlled market environments</p>
                                    <p>Notes: Algorithm successfully predicted market shifts with 92.7% accuracy in test scenarios.
                                        Social response patterns still show deviation from predictions in high-stress scenarios.
                                        Increasing neural node complexity by 15% to account for emotional variance.</p>
                                </div>
                            )}
                        </li>
                        <li
                            className={activeProject === 'NEXUS' ? styles.activeProject : ''}
                            onClick={() => toggleProject('NEXUS')}
                        >
                            <div className={styles.projectHeader}>
                                <span className={styles.projectName}>Project NEXUS</span>
                                <span className={styles.projectStatus}>STATUS: PENDING</span>
                            </div>
                            <p className={styles.projectSummary}>Quantum entanglement for instantaneous data transmission</p>
                            {activeProject === 'NEXUS' && (
                                <div className={styles.projectDetails}>
                                    <p>Classification Level: CRIMSON</p>
                                    <p>Lead Researcher: Dr. Soren Nakamura</p>
                                    <p>Progress: 32% of primary objectives achieved</p>
                                    <p>Current Phase: Quantum stability optimization</p>
                                    <p>Notes: Initial tests achieved entanglement maintenance for 3.7 seconds before decoherence.
                                        Data transfer rate: 15TB/s during stable periods. New containment field designs should
                                        extend stability to theoretical maximum of 12.4 seconds.</p>
                                </div>
                            )}
                        </li>
                        <li
                            className={activeProject === 'CHIMERA' ? styles.activeProject : ''}
                            onClick={() => toggleProject('CHIMERA')}
                        >
                            <div className={styles.projectHeader}>
                                <span className={styles.projectName}>Project CHIMERA</span>
                                <span className={styles.projectStatus}>STATUS: SUSPENDED</span>
                            </div>
                            <p className={styles.projectSummary}>Synthetic biological/mechanical hybrid systems</p>
                            {activeProject === 'CHIMERA' && (
                                <div className={styles.projectDetails}>
                                    <p>Classification Level: BLACK</p>
                                    <p>Lead Researcher: REDACTED</p>
                                    <p>Progress: CLASSIFIED</p>
                                    <p>Current Phase: PROJECT TEMPORARILY SUSPENDED</p>
                                    <p>Notes: All research materials secured in deep storage facility VOID-7.
                                        Personnel reassigned. Reason for suspension: ETHICAL CONTAINMENT BREACH.
                                        Awaiting review by Ethics Committee and Board of Directors.</p>
                                </div>
                            )}
                        </li>
                    </ul>
                </div>

                <div className={styles.dataVisual}>
                    <h2>RESEARCH FACILITY NETWORK</h2>
                    <div className={styles.dataMap}>
                        <div className={styles.mapPlaceholder}>
                            <div className={styles.facilityNode} style={{ top: '30%', left: '20%' }} title="Main Research Campus">
                                <div className={styles.nodePoint}></div>
                                <span>HQ-1</span>
                            </div>
                            <div className={styles.facilityNode} style={{ top: '45%', left: '70%' }} title="Quantum Research Facility">
                                <div className={styles.nodePoint}></div>
                                <span>QRF-3</span>
                            </div>
                            <div className={styles.facilityNode} style={{ top: '75%', left: '30%' }} title="Neural Science Division">
                                <div className={styles.nodePoint}></div>
                                <span>NSD-7</span>
                            </div>
                            <div className={styles.facilityNode} style={{ top: '15%', left: '60%' }} title="Orbital Research Station">
                                <div className={styles.nodePoint}></div>
                                <span>ORS-2</span>
                            </div>
                            <div className={styles.facilityNode} style={{ top: '60%', left: '85%' }} title="Deep Ocean Laboratory">
                                <div className={styles.nodePoint}></div>
                                <span>DOL-9</span>
                            </div>
                            <svg className={styles.connectionLines} viewBox="0 0 100 100" preserveAspectRatio="none">
                                <line x1="20" y1="30" x2="70" y2="45" />
                                <line x1="20" y1="30" x2="30" y2="75" />
                                <line x1="20" y1="30" x2="60" y2="15" />
                                <line x1="70" y1="45" x2="85" y2="60" />
                                <line x1="70" y1="45" x2="30" y2="75" />
                                <line x1="60" y1="15" x2="70" y2="45" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className={styles.dataPanel}>
                    <h2>LATEST BREAKTHROUGH RESULTS</h2>
                    <div className={styles.researchResults}>
                        <div className={styles.resultItem}>
                            <div className={styles.resultHeader}>
                                <span className={styles.resultTitle}>Neural Pathway Stability Increased</span>
                                <span className={styles.resultDate}>Date: 2077-08-21</span>
                            </div>
                            <p>New insulation technique increases neural pathway stability by 43% while reducing energy consumption. Compatible with all current cybernetic implants.</p>
                        </div>

                        <div className={styles.resultItem}>
                            <div className={styles.resultHeader}>
                                <span className={styles.resultTitle}>Quantum Computing Breakthrough</span>
                                <span className={styles.resultDate}>Date: 2077-08-19</span>
                            </div>
                            <p>Successful implementation of room-temperature quantum computing cluster. Processing power exceeds previous generation by 240% with 38% reduction in cooling requirements.</p>
                        </div>

                        <div className={styles.resultItem}>
                            <div className={styles.resultHeader}>
                                <span className={styles.resultTitle}>Enhanced Memory Storage Substrate</span>
                                <span className={styles.resultDate}>Date: 2077-08-17</span>
                            </div>
                            <p>New molecular storage medium achieves 2.5 petabytes per cubic centimeter. Patent pending, commercial applications in development with estimated market release Q2 2078.</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className={styles.footer}>
                <div>NU ADVANCED RESEARCH DIVISION • CLASSIFIED ACCESS</div>
                <div className={styles.statusIndicator}>SECURE CONNECTION • DATA ENCRYPTION ACTIVE</div>
            </footer>
        </div>
    );
};

// Export site data for the browser implementation
export const siteData = {
    id: 'infostream',
    name: 'NU',
    url: 'infostream.cyb',
    isMobile: true,
    component: <InfoStream />
};

export default InfoStream;