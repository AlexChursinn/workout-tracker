import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DateSelector from './DateSelector';
import Spinner from './Spinner';
import styles from './Home.module.css';
import calendarIconBlack from '../assets/calendar-black.svg';
import calendarIconWhite from '../assets/calendar-white.svg';
import doneIconBlack from '../assets/done-black.svg';
import doneIconWhite from '../assets/done-light.svg';
import lineBlack from '../assets/lineupblack.svg';
import lineWhite from '../assets/lineupwhite.svg';
import titleBlack from '../assets/title-black.svg';
import titleWhite from '../assets/title-white.svg';

const Home = ({ workoutData, onDateSelect, darkMode, loading }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateSelectorRef = useRef(null);
  const navigate = useNavigate();

  if (loading) {
    return <Spinner darkMode={darkMode} />;
  }

  // Обновленная фильтрация данных с учетом новой структуры
  const filteredWorkoutData = Object.entries(workoutData)
    .filter(([_, data]) => data?.exercises?.length > 0) // Проверяем, что есть упражнения
    .map(([date, data]) => ({
      date,
      title: data.title || '',
      exerciseCount: data.exercises.length,
    }));

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

  const handleCalendarClick = () => {
    if (dateSelectorRef.current) {
      dateSelectorRef.current.toggleCalendar(); // Предполагается, что DateSelector поддерживает метод toggleCalendar
    }
  };

  return (
    <div className={styles.homeContainer}>
      <div className={styles.dateHeader}>
        <img
          src={darkMode ? calendarIconBlack : calendarIconWhite}
          alt="Календарь"
          className={styles.calendarIcon}
          onClick={handleCalendarClick}
        />
        <DateSelector
          ref={dateSelectorRef}
          selectedDate={selectedDate}
          onDateSelect={handleDateChange}
          filledDates={filteredWorkoutData.map((data) => data.date)} // Передаем только даты
        />
      </div>
      {hasWorkouts ? (
        <>
          <h1 className={styles.mainTitle}>История тренировок</h1>
          {filteredWorkoutData
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Сортировка по дате
            .map(({ date, title, exerciseCount }) => (
              <div
                key={date}
                className={styles.workoutBlock}
                onClick={() => handleDateChange(new Date(date))}
                role="button"
                tabIndex="0"
                onKeyDown={(e) => e.key === 'Enter' && handleDateChange(new Date(date))}
              >
<div className={styles.workoutBlockContent}>
  {/* Дата тренировки */}
  <div className={styles.workoutInfo}>
    <img
      src={darkMode ? doneIconWhite : doneIconBlack}
      alt="Иконка завершенной тренировки"
      className={styles.doneIcon}
    />
    <h3>
      {new Date(date)
        .toLocaleDateString('ru-RU', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        .replace(/^([а-яё])/i, (match) => match.toUpperCase())}
    </h3>
  </div>
  {/* Название тренировки (только если оно есть) */}
  {title && (
    <div className={styles.workoutInfo}>
      <img
        src={darkMode ? titleWhite : titleBlack}
        alt="Иконка завершенной тренировки"
        className={styles.doneIcon}
      />
      <h3>{title}</h3>
    </div>
  )}
</div>
              </div>
            ))}
        </>
      ) : (
        <div className={styles.noWorkouts}>
          <img
            src={darkMode ? lineWhite : lineBlack}
            alt="Линия"
            className={styles.lineIcon}
          />
          <h1 className={styles.noWorkoutsMessage}>
            Создайте свою тренировку через календарь
          </h1>
        </div>
      )}
    </div>
  );
};

export default Home;
