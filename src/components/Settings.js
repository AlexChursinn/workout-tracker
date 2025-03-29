import React from 'react';
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

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className={styles.settingsContainer}>
      <h1 className={styles.title}>Настройки</h1>
      <div className={styles.desktopLogo}>
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
        <div className={styles.settingItem}>
          <span className={styles.label}>Выйти</span>
          <img
            src={darkMode ? logoutIconLight : logoutIconDark}
            alt="Выйти"
            className={styles.logoutIcon}
            onClick={handleLogoutClick}
          />
        </div>

        {/* Telegram с "create by" */}
        <div className={styles.settingItem}>
          <span className={styles.label}>Create by</span>
          <a
            href="https://t.me/chursin_tut"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.telegramLink}
          >
            <img
              src={darkMode ? tgWhite : tgBlack}
              alt="Telegram"
              className={styles.telegramIcon}
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Settings;