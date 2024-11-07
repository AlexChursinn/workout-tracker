// src/components/Spinner.js
import React from 'react';
import styles from './Spinner.module.css';
import spinerLight from '../assets/spiner-black.svg'; // Отображается при светлой теме
import spinerDark from '../assets/spiner-white.svg'; // Отображается при темной теме

const Spinner = ({ darkMode, isButton = false }) => {
  const spinnerSrc = darkMode ? spinerDark : spinerLight;
  const spinnerClass = isButton ? styles.spinnerButton : styles.spinner;

  return (
    <div className={styles.spinnerContainer}>
      <img src={spinnerSrc} alt="Loading..." className={spinnerClass} />
    </div>
  );
};

export default Spinner;
