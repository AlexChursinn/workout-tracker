// src/components/Footer.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Footer.module.css';
import todayIcon from '../assets/today-icon.svg'; // Иконка для текущей даты
import analyticsIcon from '../assets/analytics-icon.svg'; // Иконка для аналитики

const Footer = ({ onNavigateToday }) => {
    const navigate = useNavigate();

    const handleTodayClick = () => {
        navigate('/');          // Переход на главную страницу
        onNavigateToday();       // Установка текущей даты
    };

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.navButton}>
                    <button onClick={handleTodayClick} className={styles.navButton}>
                        <img src={todayIcon} alt="Сегодня" className={styles.icon} />
                    </button>
                </div>
                <div className={styles.divider}></div>
                <div className={styles.navButton}>
                    <button onClick={() => navigate('/analytics')} className={styles.navButton}>
                        <img src={analyticsIcon} alt="Аналитика" className={styles.icon} />
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
