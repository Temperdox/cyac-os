import React, { useState, useEffect } from 'react';
import styles from './RetroCalendar.module.css';

interface RetroCalendarProps {
    isOpen: boolean;
    onClose: () => void;
}

const RetroCalendar: React.FC<RetroCalendarProps> = ({ isOpen, onClose }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [timerMinutes, setTimerMinutes] = useState(30);

    // When component mounts, set the selected date to 28th of current month to match screenshot
    useEffect(() => {
        // Set selected date to the 28th of current month
        const today = new Date();
        const day28 = new Date(today.getFullYear(), today.getMonth(), 28);
        setSelectedDate(day28);
    }, []);

    // Close calendar when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (isOpen && !target.closest(`.${styles.calendarContainer}`) &&
                !target.closest(`.clockButton`)) { // Don't close when clicking clock
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Generate calendar days
    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // First day of the month (0 = Sunday, 1 = Monday, etc.)
        const firstDay = new Date(year, month, 1).getDay();

        // Last day of the month
        const lastDay = new Date(year, month + 1, 0).getDate();

        // Days from previous month
        const daysFromPrevMonth = firstDay === 0 ? 6 : firstDay - 1;

        // Last day of previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        // Days from next month to fill the 6x7 grid
        const nextMonthDays = 42 - (daysFromPrevMonth + lastDay); // 6 rows x 7 days = 42

        const calendarDays = [];

        // Add days from previous month
        for (let i = daysFromPrevMonth; i > 0; i--) {
            const day = prevMonthLastDay - i + 1;
            calendarDays.push({
                day,
                month: month - 1,
                year,
                isCurrentMonth: false,
            });
        }

        // Add days from current month
        for (let i = 1; i <= lastDay; i++) {
            calendarDays.push({
                day: i,
                month,
                year,
                isCurrentMonth: true,
            });
        }

        // Add days from next month
        for (let i = 1; i <= nextMonthDays; i++) {
            calendarDays.push({
                day: i,
                month: month + 1,
                year,
                isCurrentMonth: false,
            });
        }

        return calendarDays;
    };

    // Handle month navigation
    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Handle date selection
    const handleDateClick = (day: number, month: number, year: number) => {
        setSelectedDate(new Date(year, month, day));
    };

    // Handle timer adjustment
    const decreaseMinutes = () => {
        if (timerMinutes > 5) {
            setTimerMinutes(timerMinutes - 5);
        }
    };

    const increaseMinutes = () => {
        if (timerMinutes < 120) {
            setTimerMinutes(timerMinutes + 5);
        }
    };

    // Focus timer
    const handleFocusClick = () => {
        // This would connect to your focus timer functionality
        console.log(`Starting focus timer for ${timerMinutes} minutes`);
        // Close calendar after starting timer
        onClose();
    };

    // Format current date for header
    const formatHeaderDate = () => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        }).format(selectedDate);
    };

    // Format month and year
    const formatMonthYear = () => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            year: 'numeric'
        }).format(currentDate);
    };

    if (!isOpen) return null;

    const calendarDays = generateCalendarDays();
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Check if a date is today
    const isToday = (day: number, month: number, year: number) => {
        const today = new Date();
        return day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
    };

    // Check if a date is selected
    const isSelected = (day: number, month: number, year: number) => {
        return day === selectedDate.getDate() &&
            month === selectedDate.getMonth() &&
            year === selectedDate.getFullYear();
    };

    return (
        <div className={styles.calendarContainer}>
            <div className={styles.headerBar}>
                <div className={styles.currentDate}>{formatHeaderDate()}</div>
                <button className={styles.closeButton} onClick={onClose}>
                    <span>×</span>
                </button>
            </div>

            <div className={styles.calendarContent}>
                <div className={styles.monthSelector}>
                    <div className={styles.monthYear}>{formatMonthYear()}</div>
                    <div className={styles.navigationButtons}>
                        <button className={styles.navButton} onClick={handlePrevMonth} aria-label="Previous month">
                            <span className={styles.triangleUp}></span>
                        </button>
                        <button className={styles.navButton} onClick={handleNextMonth} aria-label="Next month">
                            <span className={styles.triangleDown}></span>
                        </button>
                    </div>
                </div>

                <div className={styles.calendarGrid}>
                    {/* Day names row */}
                    {dayNames.map((day, index) => (
                        <div key={`header-${index}`} className={styles.dayName}>
                            {day}
                        </div>
                    ))}

                    {/* Calendar days */}
                    {calendarDays.map((day, index) => (
                        <div
                            key={`day-${index}`}
                            className={`${styles.calendarDay} 
                                ${day.isCurrentMonth ? '' : styles.otherMonth}
                                ${isToday(day.day, day.month, day.year) ? styles.today : ''}
                                ${isSelected(day.day, day.month, day.year) ? styles.selected : ''}`}
                            onClick={() => handleDateClick(day.day, day.month, day.year)}
                            data-day={day.day}
                        >
                            {day.day}
                        </div>
                    ))}
                </div>

                <div className={styles.timerSection}>
                    <button className={styles.timerButton} onClick={decreaseMinutes} aria-label="Decrease minutes">
                        <span>−</span>
                    </button>
                    <div className={styles.timerDisplay}>
                        <span>{timerMinutes}</span> mins
                    </div>
                    <button className={styles.timerButton} onClick={increaseMinutes} aria-label="Increase minutes">
                        <span>+</span>
                    </button>

                    <button className={styles.focusButton} onClick={handleFocusClick} aria-label="Start focus timer">
                        <span className={styles.playIcon}></span> Focus
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RetroCalendar;