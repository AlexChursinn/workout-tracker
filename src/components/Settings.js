import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tgWhite from '../assets/tg-white.svg';
import tgBlack from '../assets/tg-black.svg';
import logoutIconLight from '../assets/logout-light.svg';
import logoutIconDark from '../assets/logout-dark.svg';
import myTgBlack from '../assets/my-tg-black.svg';
import myTgWhite from '../assets/my-tg-white.svg';
import styles from './Settings.module.css';

const Settings = ({ darkMode, toggleTheme, onLogout }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Задержка появления на 1 секунду
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    // Очистка таймера при размонтировании компонента
    return () => clearTimeout(timer);
  }, []);

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className={styles.settingsContainer}>
      <h1 className={styles.title}>Настройки</h1>
      <div className={`${styles.desktopLogo} ${isVisible ? styles.visible : ''}`}>
        <img
          src={darkMode ? myTgWhite : myTgBlack}
          alt="Logo"
          className={styles.logoImage}
        />
      </div>
      <div className={styles.settingsList}>
        {/* Переключатель темы */}
        <div className={styles.settingItem}>
          <span className={styles.label}>Тема</span>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={toggleTheme}
              className={styles.switchInput}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        {/* Кнопка выхода с иконкой */}
        <div className={styles.settingItem} onClick={handleLogoutClick}>
          <span className={styles.label}>Выйти</span>
          <img
            src={darkMode ? logoutIconLight : logoutIconDark}
            alt="Выйти"
            className={styles.logoutIcon}
          />
        </div>

        {/* Telegram с "create by" */}
        <a
          href="https://t.me/chursin_tut"
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.telegramLink} ${isVisible ? styles.visible : ''}`}
        >
          <div className={styles.settingItem}>
            <span className={styles.label}>Create by</span>
            <img
              src={darkMode ? tgWhite : tgBlack}
              alt="Telegram"
              className={styles.telegramIcon}
            />
          </div>
        </a>
      </div>
    </div>
  );
};

export default Settings;