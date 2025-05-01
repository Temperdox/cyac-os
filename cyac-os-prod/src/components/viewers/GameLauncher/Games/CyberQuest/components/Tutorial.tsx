import React, { useState, useEffect } from 'react';
import styles from './Tutorial.module.css';

interface TutorialProps {
    onComplete: () => void;
}

interface TutorialStep {
    title: string;
    content: string;
    image?: string;
}

const Tutorial: React.FC<TutorialProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [animationClass, setAnimationClass] = useState<string>(styles.fadeIn);

    // Define tutorial steps
    const tutorialSteps: TutorialStep[] = [
        {
            title: "Welcome to CyberQuest",
            content: "Greetings, Agent. Welcome to CyberQuest, a cyber infiltration training program designed to hone your hacking skills. In this simulation, you'll navigate through various digital systems, solve puzzles, and earn rewards."
        },
        {
            title: "Game Objectives",
            content: "Each mission has specific objectives that must be completed to succeed. These range from hacking terminals, collecting data, solving puzzles, to navigating complex network structures. Complete all objectives to finish a mission."
        },
        {
            title: "Earning Credits",
            content: "Your performance is measured in Cyber Credits (cR). Earn credits by completing objectives, finishing missions quickly, and achieving perfect scores. These credits can be spent in the shop to purchase tools, upgrades, and power-ups to enhance your capabilities."
        },
        {
            title: "Digital Tools",
            content: "Throughout your missions, you'll acquire various digital tools to assist you. Tools like scanners, decryptors, and analyzers can help you overcome challenges more efficiently. Some tools are permanent, while others are consumable."
        },
        {
            title: "Achievements",
            content: "Demonstrate your hacking prowess by unlocking achievements. These special recognitions are awarded for significant accomplishments, such as completing certain numbers of missions, achieving perfect scores, or finding hidden secrets."
        },
        {
            title: "Mission Types",
            content: "You'll encounter various mission types, each with unique gameplay mechanics: Puzzles, Decryption Challenges, Network Mazes, Stealth Operations, and more. Each requires different strategies and skills to master."
        },
        {
            title: "Ready to Begin",
            content: "Your training begins with a series of introductory missions designed to familiarize you with basic operations. Complete these to unlock more advanced challenges. Good luck, Agent. The system awaits your expertise."
        }
    ];

    // Animate between steps
    const goToNextStep = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setAnimationClass(styles.fadeOut);

            // Wait for fade out animation to complete
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
                setAnimationClass(styles.fadeIn);
            }, 300);
        } else {
            // Complete tutorial on last step
            setAnimationClass(styles.fadeOut);

            setTimeout(() => {
                onComplete();
            }, 300);
        }
    };

    const goToPrevStep = () => {
        if (currentStep > 0) {
            setAnimationClass(styles.fadeOut);

            // Wait for fade out animation to complete
            setTimeout(() => {
                setCurrentStep(prev => prev - 1);
                setAnimationClass(styles.fadeIn);
            }, 300);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                goToNextStep();
            } else if (e.key === 'ArrowLeft') {
                goToPrevStep();
            } else if (e.key === 'Escape') {
                onComplete();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentStep]);

    return (
        <div className={styles.tutorialOverlay}>
            <div className={styles.tutorialContent}>
                <div className={styles.tutorialHeader}>
                    <h2 className={styles.tutorialTitle}>
                        AGENT TRAINING PROTOCOL
                    </h2>
                    <div className={styles.stepIndicator}>
                        Step {currentStep + 1} of {tutorialSteps.length}
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={onComplete}
                        aria-label="Close Tutorial"
                    >
                        ×
                    </button>
                </div>

                <div className={styles.stepContent}>
                    <div className={`${styles.stepInner} ${animationClass}`}>
                        <h3 className={styles.stepTitle}>
                            {tutorialSteps[currentStep].title}
                        </h3>

                        {tutorialSteps[currentStep].image && (
                            <div className={styles.imageContainer}>
                                <img
                                    src={tutorialSteps[currentStep].image}
                                    alt={tutorialSteps[currentStep].title}
                                    className={styles.tutorialImage}
                                />
                            </div>
                        )}

                        <p className={styles.stepDescription}>
                            {tutorialSteps[currentStep].content}
                        </p>
                    </div>
                </div>

                <div className={styles.navigationButtons}>
                    <button
                        className={styles.navButton}
                        onClick={goToPrevStep}
                        disabled={currentStep === 0}
                    >
                        Previous
                    </button>

                    <div className={styles.progressDots}>
                        {tutorialSteps.map((_, index) => (
                            <div
                                key={index}
                                className={`${styles.dot} ${currentStep === index ? styles.activeDot : ''}`}
                                onClick={() => {
                                    setAnimationClass(styles.fadeOut);
                                    setTimeout(() => {
                                        setCurrentStep(index);
                                        setAnimationClass(styles.fadeIn);
                                    }, 300);
                                }}
                            />
                        ))}
                    </div>

                    <button
                        className={styles.navButton}
                        onClick={goToNextStep}
                    >
                        {currentStep === tutorialSteps.length - 1 ? 'Complete' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Tutorial;