import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoBlack from '../assets/logo-black.svg';
import logoWhite from '../assets/logo-white.svg';
import sunIcon from '../assets/sun.svg';
import moonIcon from '../assets/moon.svg';
import logoutIconLight from '../assets/logout-light.svg';
import logoutIconDark from '../assets/logout-dark.svg';
import styles from './Header.module.css';

const Header = ({ darkMode, toggleTheme, onLogout, showLogoutButton }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTodayClick = () => {
    navigate('/home');
  };

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.headerContainer}>
        <img 
          src={darkMode ? logoWhite : logoBlack} 
          alt="Логотип" 
          className={styles.logo} 
          onClick={handleTodayClick} 
        />
        <div className={styles.controls}>
          {/* Переключатель темы для десктопа (всегда виден) */}
          <div className={`${styles.themeToggle} ${styles.desktopOnly}`} onClick={toggleTheme}>
            <img src={darkMode ? sunIcon : moonIcon} alt="Переключение темы" />
          </div>
          {/* Переключатель темы для мобильных (только до авторизации) */}
          {!showLogoutButton && (
            <div className={`${styles.themeToggle} ${styles.mobileOnly}`} onClick={toggleTheme}>
              <img src={darkMode ? sunIcon : moonIcon} alt="Переключение темы" />
            </div>
          )}
          {/* Кнопка выхода (только после авторизации, только на десктопе) */}
          {showLogoutButton && (
            <button className={`${styles.logoutButton} ${styles.desktopOnly}`} onClick={onLogout}>
              <img
                src={darkMode ? logoutIconLight : logoutIconDark}
                alt="Выйти"
                className={styles.logoutIcon}
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;