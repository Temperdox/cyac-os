import React from 'react';
import styles from './Factions.module.css';

const Factions: React.FC = () => {
    return (
        <div className={styles.factionsPage}>
            <header className={styles.header}>
                <h1>TRAXUS</h1>
                <div className={styles.subtitle}>CORPORATE FACTIONS DIRECTORY</div>
            </header>

            <main className={styles.factionsGrid}>
                <div className={styles.factionCard}>
                    <div className={styles.factionHeader}>
                        <div className={styles.factionLogo}>
                            <img src="./assets/images/logos/others/TRAXUS.png" alt="TRAXUS" />
                        </div>
                        <div className={styles.factionTitle}>
                            <h2>TRAXUS HEAVY INDUSTRIES</h2>
                            <div className={styles.factionType}>MANUFACTURING CONGLOMERATE</div>
                        </div>
                    </div>
                    <div className={styles.factionDetails}>
                        <p className={styles.factionDescription}>
                            Global leader in heavy machinery, aerospace technology, and defense systems. Known for cutting-edge industrial applications and military-grade hardware.
                        </p>
                        <div className={styles.factionStats}>
                            <span>INFLUENCE: 89%</span>
                            <span>ASSETS: 7.8T</span>
                            <span>THREAT: HIGH</span>
                        </div>
                    </div>
                </div>

                <div className={styles.factionCard}>
                    <div className={styles.factionHeader}>
                        <div className={styles.factionLogo}>
                            <img src="./assets/images/logos/others/MIDA.png" alt="MIDA" />
                        </div>
                        <div className={styles.factionTitle}>
                            <h2>MIDA GLOBAL NETWORK</h2>
                            <div className={styles.factionType}>MEDIA CONGLOMERATE</div>
                        </div>
                    </div>
                    <div className={styles.factionDetails}>
                        <p className={styles.factionDescription}>
                            Controls 73% of worldwide media distribution channels. Specializes in information control, public relations management, and digital content delivery systems.
                        </p>
                        <div className={styles.factionStats}>
                            <span>INFLUENCE: 92%</span>
                            <span>ASSETS: 5.2T</span>
                            <span>THREAT: EXTREME</span>
                        </div>
                    </div>
                </div>

                <div className={styles.factionCard}>
                    <div className={styles.factionHeader}>
                        <div className={styles.factionLogo}>
                            <img src="./assets/images/logos/others/NU.png" alt="NU" />
                        </div>
                        <div className={styles.factionTitle}>
                            <h2>NU ADVANCED RESEARCH</h2>
                            <div className={styles.factionType}>R&D CORPORATION</div>
                        </div>
                    </div>
                    <div className={styles.factionDetails}>
                        <p className={styles.factionDescription}>
                            Pioneer in quantum computing, biotechnology, and experimental physics. Operates numerous black-site research facilities with minimal oversight.
                        </p>
                        <div className={styles.factionStats}>
                            <span>INFLUENCE: 78%</span>
                            <span>ASSETS: 4.3T</span>
                            <span>THREAT: CRITICAL</span>
                        </div>
                    </div>
                </div>

                <div className={styles.factionCard}>
                    <div className={styles.factionHeader}>
                        <div className={styles.factionLogo}>
                            <img src="./assets/images/logos/others/SEKIGUCHI.png" alt="SEKIGUCHI" />
                        </div>
                        <div className={styles.factionTitle}>
                            <h2>SEKIGUCHI DIGITAL SYSTEMS</h2>
                            <div className={styles.factionType}>CYBERSECURITY CORP</div>
                        </div>
                    </div>
                    <div className={styles.factionDetails}>
                        <p className={styles.factionDescription}>
                            Global leader in cryptographic systems, network security, and countermeasure development. Rumored to control the largest private surveillance network.
                        </p>
                        <div className={styles.factionStats}>
                            <span>INFLUENCE: 82%</span>
                            <span>ASSETS: 3.9T</span>
                            <span>THREAT: HIGH</span>
                        </div>
                    </div>
                </div>

                <div className={styles.factionCard}>
                    <div className={styles.factionHeader}>
                        <div className={styles.factionLogo}>
                            <img src="./assets/images/logos/others/UESC.png" alt="UESC" />
                        </div>
                        <div className={styles.factionTitle}>
                            <h2>UESC TERRAFORMING</h2>
                            <div className={styles.factionType}>ENVIRONMENTAL ENGINEERING</div>
                        </div>
                    </div>
                    <div className={styles.factionDetails}>
                        <p className={styles.factionDescription}>
                            Specializes in atmospheric processing, climate control systems, and sustainable habitat development. Currently leading Mars colonization efforts.
                        </p>
                        <div className={styles.factionStats}>
                            <span>INFLUENCE: 67%</span>
                            <span>ASSETS: 2.8T</span>
                            <span>THREAT: MODERATE</span>
                        </div>
                    </div>
                </div>

                <div className={styles.factionCard}>
                    <div className={styles.factionHeader}>
                        <div className={styles.factionLogo}>
                            <img src="./assets/images/logos/CYAC.png" alt="CYAC" />
                        </div>
                        <div className={styles.factionTitle}>
                            <h2>CYBERACME INDUSTRIES</h2>
                            <div className={styles.factionType}>TECHNOLOGY INTEGRATION</div>
                        </div>
                    </div>
                    <div className={styles.factionDetails}>
                        <p className={styles.factionDescription}>
                            Emerging player specializing in neural interface systems, augmented reality, and cybernetic enhancements. Rapidly expanding market presence.
                        </p>
                        <div className={styles.factionStats}>
                            <span>INFLUENCE: 54%</span>
                            <span>ASSETS: 1.7T</span>
                            <span>THREAT: RISING</span>
                        </div>
                    </div>
                </div>
            </main>

            <footer className={styles.footer}>
                <div>TRAXUS DATABASE ACCESS TERMINAL • RESTRICTED NETWORK</div>
                <div className={styles.statusIndicator}>SECURE CONNECTION ESTABLISHED • ENCRYPTION ACTIVE</div>
            </footer>
        </div>
    );
};

// Export site data for the browser implementation
export const siteData = {
    id: 'factions',
    name: 'TRAXUS',
    url: 'factions.cyb',
    isMobile: true,
    component: <Factions />
};

export default Factions;