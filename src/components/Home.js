// src/components/Home.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DateSelector from './DateSelector';
import Spinner from './Spinner';
import styles from './Home.module.css';
import calendarIconBlack from '../assets/calendar-black.svg';
import calendarIconWhite from '../assets/calendar-white.svg';
import doneIconBlack from '../assets/done-black.svg';
import doneIconWhite from '../assets/done-light.svg';

const Home = ({ workoutData, onDateSelect, darkMode, loading }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  // Проверяем, загружаются ли данные
  if (loading) {
    return <Spinner darkMode={darkMode} />;
  }

  // Фильтруем только те даты, где есть тренировки
  const filteredWorkoutData = Object.keys(workoutData).filter(
    (date) => workoutData[date] && Array.isArray(workoutData[date]) && workoutData[date].length > 0
  );

  const hasWorkouts = filteredWorkoutData.length > 0;

  const handleDateChange = (date) => {
    if (date instanceof Date && !isNaN(date)) {
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      setSelectedDate(localDate);
      onDateSelect(localDate);
      const formattedDate = localDate.toISOString().split('T')[0];
      navigate(`/${formattedDate}`);
    } else {
      console.error('Invalid date:', date);
    }
  };

  return (
    <div className={styles.homeContainer}>
      <div className={styles.dateHeader}>
        <img
          src={darkMode ? calendarIconBlack : calendarIconWhite}
          alt="Календарь"
          className={styles.calendarIcon}
        />
        <DateSelector
          selectedDate={selectedDate}
          onDateSelect={handleDateChange}
          filledDates={filteredWorkoutData}
        />
      </div>
      {hasWorkouts ? (
        <>
          <h1>История тренировок</h1>
          {filteredWorkoutData.sort((a, b) => new Date(b) - new Date(a)).map((date) => (
            <div
              key={date}
              className={styles.workoutBlock}
              onClick={() => handleDateChange(new Date(date))}
            >
              <div className={styles.workoutBlockContent}>
                <img
                  src={darkMode ? doneIconWhite : doneIconBlack}
                  alt="Иконка завершенной тренировки"
                  className={styles.doneIcon}
                />
                <h3>{new Date(date).toLocaleDateString()}</h3>
              </div>
              <p>{workoutData[date]?.name || 'Название тренировки'}</p>
            </div>
          ))}
        </>
      ) : (
        <h1 className={styles.noWorkoutsMessage}>Создайте свою тренировку через календарь</h1>
      )}
    </div>
  );
};

export default Home;
