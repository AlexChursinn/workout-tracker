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
import numberIconBlack from '../assets/numberIcon-black.svg';
import numberIconWhite from '../assets/numberIcon-white.svg';

const Home = ({ workoutData, onDateSelect, darkMode, loading }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateSelectorRef = useRef(null);
  const navigate = useNavigate();

  if (loading) {
    return <Spinner darkMode={darkMode} />;
  }

  const workoutsByDate = Object.entries(workoutData).reduce((acc, [date, workouts]) => {
    acc[date] = workouts;
    return acc;
  }, {});

  const filteredWorkoutData = Object.entries(workoutData)
    .flatMap(([date, workouts]) =>
      workouts.map((workout) => ({
        date,
        workoutId: workout.workoutId,
        title: workout.title,
        exerciseCount: workout.exercises.length,
      }))
    )
    .filter((data) => data.exerciseCount > 0);

  const hasWorkouts = filteredWorkoutData.length > 0;

  const handleDateChange = (date, workoutId) => {
    if (date instanceof Date && !isNaN(date)) {
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      setSelectedDate(localDate);
      onDateSelect(localDate, workoutId);
      const formattedDate = localDate.toISOString().split('T')[0];
      // Используем replace вместо push, чтобы не добавлять новую запись в историю
      navigate(`/${formattedDate}/${workoutId}`, { replace: true });
    } else {
      console.error('Invalid date:', date);
    }
  };

  const handleCalendarClick = () => {
    if (dateSelectorRef.current) {
      dateSelectorRef.current.toggleCalendar();
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
          onDateSelect={(date) => handleDateChange(date, 1)}
          filledDates={filteredWorkoutData.map((data) => data.date)}
        />
      </div>
      {hasWorkouts ? (
        <>
          <h1 className={styles.mainTitle}>История тренировок</h1>
          {filteredWorkoutData
            .sort((a, b) => new Date(b.date) - new Date(a.date) || b.workoutId - a.workoutId)
            .map(({ date, workoutId, title, exerciseCount }) => {
              const workoutsForDate = workoutsByDate[date] || [];
              const showWorkoutNumber = workoutsForDate.length > 1;

              return (
                <div
                  key={`${date}-${workoutId}`}
                  className={styles.workoutBlock}
                  onClick={() => handleDateChange(new Date(date), workoutId)}
                  role="button"
                  tabIndex="0"
                  onKeyDown={(e) => e.key === 'Enter' && handleDateChange(new Date(date), workoutId)}
                >
                  <div className={styles.workoutBlockContent}>
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
                    {title && (
                      <div className={styles.workoutInfo}>
                        <img
                          src={darkMode ? titleWhite : titleBlack}
                          alt="Иконка названия тренировки"
                          className={styles.doneIcon}
                        />
                        <h3>{title}</h3>
                      </div>
                    )}
                    {showWorkoutNumber && (
                      <div className={styles.workoutInfo}>
                        <img
                          src={darkMode ? numberIconWhite : numberIconBlack}
                          alt="Иконка номера тренировки"
                          className={styles.doneIcon}
                        />
                        <h3>Тренировка №{workoutId}</h3>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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