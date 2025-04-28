// Starfall.tsx
import React, { useEffect, useRef } from 'react';
import styles from './Starfall.module.css';

const Starfall: React.FC = () => {
    const splineContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Create script element for Spline viewer
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://unpkg.com/@splinetool/viewer@1.9.68/build/spline-viewer.js';
        document.head.appendChild(script);

        // Create the spline-viewer element
        const splineViewer = document.createElement('spline-viewer');
        splineViewer.setAttribute('loading-anim-type', 'spinner-big-light');
        splineViewer.setAttribute('url', 'https://prod.spline.design/89SPXgizXr6YmfZe/scene.splinecode');

        // Add the spline viewer to our container
        if (splineContainerRef.current) {
            splineContainerRef.current.appendChild(splineViewer);
        }

        // Hide the Spline logo
        const hideLogo = () => {
            if (splineViewer.shadowRoot) {
                const logo = splineViewer.shadowRoot.getElementById('logo');
                if (logo) {
                    logo.style.display = 'none';
                }
            }
        };

        // Try immediately and also after the viewer loads
        hideLogo();
        splineViewer.addEventListener('load', hideLogo);

        // Cleanup function
        return () => {
            if (splineContainerRef.current && splineContainerRef.current.contains(splineViewer)) {
                splineContainerRef.current.removeChild(splineViewer);
            }
            document.head.removeChild(script);
        };
    }, []);

    return (
        <div className={styles.sitePage}>
            <header className={styles.header}>
                <h1>STARFALL</h1>
                <div className={styles.subtitle}>INTERACTIVE STELLAR SIMULATION</div>
            </header>

            <main className={styles.content}>
                <div className={styles.splineContainer} ref={splineContainerRef}>
                    {/* Spline viewer will be added here dynamically */}
                </div>

                <div className={styles.section}>
                    <h2>ABOUT THIS SIMULATION</h2>
                    <p>
                        Experience the cosmic ballet of stellar formation and collapse.
                        This interactive 3D simulation illustrates the life cycle of celestial bodies
                        in our universe.
                    </p>
                    <p>
                        Navigate the simulation using your mouse or touch controls.
                        Drag to rotate, scroll to zoom, and right-click to pan.
                    </p>
                </div>
            </main>

            <footer className={styles.footer}>
                <div>SUNSCIN • STARFALL SIMULATION</div>
                <div className={styles.statusIndicator}>SECURE CONNECTION ESTABLISHED</div>
            </footer>
        </div>
    );
};

// Export site data for the browser implementation
export const siteData = {
    id: 'starfall',
    name: 'STARFALL',
    url: 'starfall.cyb',
    isMobile: false,
    component: <Starfall />
};

export default Starfall;