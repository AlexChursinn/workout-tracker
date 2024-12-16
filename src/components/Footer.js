import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import todayIconLight from '../assets/today-icon-light.svg';
import todayIconDark from '../assets/today-icon-dark.svg';
import analyticsIconLight from '../assets/analytics-icon-light.svg';
import analyticsIconDark from '../assets/analytics-icon-dark.svg';
import settingsIconLight from '../assets/settings-icon-light.svg'; // Иконка для светлой темы
import settingsIconDark from '../assets/settings-icon-dark.svg'; // Иконка для темной темы
import styles from './Footer.module.css';

const Footer = ({ darkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isCurrentPage = (path) => location.pathname === path;

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Сегодня */}
        <div className={styles.navButton}>
          <button onClick={() => navigate('/home')} className={styles.navButton}>
            <img
              src={darkMode ? todayIconLight : todayIconDark}
              alt="Сегодня"
              className={`${styles.icon} ${isCurrentPage('/home') ? styles.active : ''}`}
            />
          </button>
        </div>

        {/* Разделитель */}
        <div className={styles.divider}></div>

        {/* Аналитика */}
        <div className={styles.navButton}>
          <button onClick={() => navigate('/analytics')} className={styles.navButton}>
            <img
              src={darkMode ? analyticsIconLight : analyticsIconDark}
              alt="Аналитика"
              className={`${styles.icon} ${isCurrentPage('/analytics') ? styles.active : ''}`}
            />
          </button>
        </div>

        {/* Разделитель */}
        <div className={styles.divider}></div>

        {/* Настройки */}
        <div className={styles.navButton}>
          <button onClick={() => navigate('/settings')} className={styles.navButton}>
            <img
              src={darkMode ? settingsIconLight : settingsIconDark} // Используем иконки в зависимости от темы
              alt="Настройки"
              className={`${styles.icon} ${isCurrentPage('/settings') ? styles.active : ''}`}
            />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
