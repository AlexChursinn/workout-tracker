// src/components/Header.js
import React from 'react';
import logoBlack from '../assets/logo-black.svg';
import logoWhite from '../assets/logo-white.svg';
import sunIcon from '../assets/sun.svg';
import moonIcon from '../assets/moon.svg';
import styles from './Header.module.css';

const Header = ({ darkMode, toggleTheme }) => {
  return (
    <header className={styles.header}>
      {/* Выбираем логотип в зависимости от темы */}
      <img src={darkMode ? logoWhite : logoBlack} alt="Логотип" className={styles.logo} />
      <div className={styles.themeToggle} onClick={toggleTheme}>
        <img src={darkMode ? sunIcon : moonIcon} alt="Переключение темы" />
      </div>
    </header>
  );
};

export default Header;
