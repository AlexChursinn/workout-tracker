// src/components/Spinner.js
import React from 'react';
import styles from './Spinner.module.css';
import spinerLight from '../assets/spiner-black.svg'; // Черный спинер для светлой темы
import spinerDark from '../assets/spiner-white.svg'; // Белый спинер для темной темы

const Spinner = ({ darkMode, isButton = false }) => {
  // Логика выбора изображения спинера в зависимости от темы
  const spinnerSrc = darkMode ? spinerDark : spinerLight;
  const spinnerClass = isButton ? styles.spinnerButton : styles.spinner;

  if (isButton) {
    return <img src={spinnerSrc} alt="Loading..." className={spinnerClass} />;
  }

  return (
    <div className={styles.spinnerContainer}>
      <img src={spinnerSrc} alt="Loading..." className={spinnerClass} />
    </div>
  );
};

export default Spinner;
