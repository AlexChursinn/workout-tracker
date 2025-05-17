import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tgWhite from '../assets/tg-white.svg';
import tgBlack from '../assets/tg-black.svg';
import logoutIconLight from '../assets/logout-light.svg';
import logoutIconDark from '../assets/logout-dark.svg';
import Spinner from './Spinner';
import { getUserInfo } from '../api';
import styles from './Settings.module.css';

const Settings = ({ darkMode, toggleTheme, onLogout, authToken }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchUserInfo = async () => {
      console.log('authToken:', authToken);
      if (!authToken) {
        setError('Токен отсутствует');
        setUserLoading(false);
        return;
      }
      try {
        setUserLoading(true);
        const data = await getUserInfo(authToken);
        console.log('User info data:', data);
        setUserInfo({
          name: data.name || 'Не указано',
          email: data.email || 'Не указано',
        });
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить данные пользователя');
        console.error('Ошибка загрузки данных пользователя:', err);
      } finally {
        setUserLoading(false);
      }
    };
    fetchUserInfo();
  }, [authToken]);

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  if (userLoading) {
    return <Spinner darkMode={darkMode} />;
  }

  return (
    <div className={styles.settingsContainer}>
      <h1 className={styles.title}>Настройки</h1>
      <div className={styles.settingsList}>
        {error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <>
            <div className={styles.settingItem}>
              <span className={styles.label}>Имя</span>
              <span className={styles.value}>{userInfo.name}</span>
            </div>
            <div className={styles.settingItem}>
              <span className={styles.label}>Почта</span>
              <span className={styles.value}>{userInfo.email}</span>
            </div>
          </>
        )}
        <div className={`${styles.settingItem} ${styles.themeItem}`}>
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
        <div className={`${styles.settingItem} ${styles.logoutItem}`} onClick={handleLogoutClick}>
          <span className={styles.label}>Выйти</span>
          <img
            src={darkMode ? logoutIconLight : logoutIconDark}
            alt="Выйти"
            className={styles.logoutIcon}
          />
        </div>
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