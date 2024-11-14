// src/components/Footer.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import todayIconLight from '../assets/today-icon-light.svg'; 
import todayIconDark from '../assets/today-icon-dark.svg';  
import analyticsIconLight from '../assets/analytics-icon-light.svg'; 
import analyticsIconDark from '../assets/analytics-icon-dark.svg';  
import styles from './Footer.module.css';

const Footer = ({ darkMode }) => {
    const navigate = useNavigate();

    const handleTodayClick = () => {
        navigate('/home');
    };

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.navButton}>
                    <button onClick={handleTodayClick} className={styles.navButton}>
                        {/* Отображаем светлую иконку, если темная тема, и темную, если светлая */}
                        <img
                            src={darkMode ? todayIconLight : todayIconDark}
                            alt="Сегодня"
                            className={styles.icon}
                        />
                    </button>
                </div>
                
                <div className={styles.divider}></div>
                
                <div className={styles.navButton}>
                    <button onClick={() => navigate('/analytics')} className={styles.navButton}>
                        {/* Отображаем светлую иконку, если темная тема, и темную, если светлая */}
                        <img
                            src={darkMode ? analyticsIconLight : analyticsIconDark}
                            alt="Аналитика"
                            className={styles.icon}
                        />
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 
