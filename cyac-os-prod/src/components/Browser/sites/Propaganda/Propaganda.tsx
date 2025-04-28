import React from 'react';
import styles from './Propaganda.module.css';

const Propaganda: React.FC = () => {
    return (
        <div className={styles.propagandaPage}>
            <header className={styles.header}>
                <h1>MIDA GLOBAL NETWORK</h1>
                <div className={styles.subtitle}>LATEST PROPAGANDA FEED</div>
            </header>

            <main className={styles.content}>
                <div className={styles.newsArticle}>
                    <h2>BREAKING: Neurocorp Announces Revolutionary Implant</h2>
                    <div className={styles.articleMeta}>POSTED: 08-25-2077 • SOURCE: MIDA CENTRAL</div>
                    <p>
                        Neurocorp unveiled their next-generation neural interface today, promising unprecedented levels
                        of integration between human consciousness and digital systems. Company representatives claim
                        the "NeoLink" implant will revolutionize everything from entertainment to workplace productivity.
                    </p>
                    <p>
                        Critics warn about potential privacy and security concerns, but market analysts predict massive
                        consumer adoption within the first quarter of release.
                    </p>
                </div>

                <div className={styles.newsArticle}>
                    <h2>City Council Approves Expanded Surveillance Measures</h2>
                    <div className={styles.articleMeta}>POSTED: 08-24-2077 • SOURCE: CITY PULSE</div>
                    <p>
                        In response to growing civil unrest, the City Council has unanimously approved the deployment of
                        enhanced surveillance systems throughout all districts. The new measures include facial recognition,
                        behavior analysis, and mood detection algorithms.
                    </p>
                    <p>
                        "This is about keeping citizens safe," stated Council President Nakamura. "The new systems will
                        ensure prompt response to any threats to public order."
                    </p>
                </div>

                <div className={styles.newsArticle}>
                    <h2>Corporate Wars: TRAXUS Acquires Rival Manufacturing Plants</h2>
                    <div className={styles.articleMeta}>POSTED: 08-23-2077 • SOURCE: BUSINESS FEED</div>
                    <p>
                        TRAXUS Heavy Industries has completed its hostile takeover of three competing manufacturing facilities
                        in the Eastern Industrial Zone. This acquisition solidifies TRAXUS's monopoly on military-grade hardware
                        production in the region.
                    </p>
                    <p>
                        Market analysts predict a 15% increase in TRAXUS stock value following the announcement, while
                        consumer advocacy groups express concerns over reduced market competition.
                    </p>
                </div>

                <div className={styles.newsArticle}>
                    <h2>Entertainment: "Neural Dreams" Breaks Streaming Records</h2>
                    <div className={styles.articleMeta}>POSTED: 08-22-2077 • SOURCE: MEDIA WIRE</div>
                    <p>
                        The latest neural entertainment experience from MIDA Studios, "Neural Dreams," has broken all previous
                        streaming records with over 500 million simultaneous users during its launch weekend. The immersive
                        experience allows users to explore fantasy landscapes through direct neural stimulation.
                    </p>
                    <p>
                        Health officials continue to recommend limiting neural entertainment sessions to four hours per day,
                        though these guidelines remain unenforceable under current legislation.
                    </p>
                </div>
            </main>

            <footer className={styles.footer}>
                <div>MIDA GLOBAL INFORMATION NETWORK • AUTHORIZED ACCESS ONLY</div>
                <div className={styles.statusIndicator}>MONITORED CONNECTION • TRACKING ACTIVE</div>
            </footer>
        </div>
    );
};

// Export site data for the browser implementation
export const siteData = {
    id: 'propaganda',
    name: 'MIDA',
    url: 'propaganda.cyb',
    isMobile: true,
    component: <Propaganda />
};

export default Propaganda;