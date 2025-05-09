import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
import DateSelector from './DateSelector';
import Spinner from './Spinner';
import { deleteWorkout, copyWorkout } from '../api';
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
import settingIcon from '../assets/setting.svg';
import copyIconBlack from '../assets/copy-black.svg';
import copyIconWhite from '../assets/copy-white.svg';
import deleteIconBlack from '../assets/delete-black.svg';
import deleteIconWhite from '../assets/delete-white.svg';
import closeIconBlack from '../assets/close-black.svg';
import closeIconWhite from '../assets/close-white.svg';
import arrowLeft from '../assets/arrow-left.svg';
import arrowRight from '../assets/arrow-right.svg';

registerLocale('ru', ru);

const ITEMS_PER_PAGE = 30;

const Home = ({ workoutData, onDateSelect, darkMode, loading, authToken, onDataUpdate }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [workoutToCopy, setWorkoutToCopy] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const dateSelectorRef = useRef(null);
  const dropdownRef = useRef(null);
  const modalRef = useRef(null);
  const navigate = useNavigate();
  const lastNavigation = useRef({ date: null, workoutId: null });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(null);
      }
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowDatePicker(false);
        setWorkoutToCopy(null);
        setError(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowDropdown(null);
        setShowDatePicker(false);
        setWorkoutToCopy(null);
        setError(null);
      }
    };

    const handleScroll = () => {
      setShowDropdown(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const formatDateToLocal = useCallback((date) => {
    return date.toLocaleDateString('sv-SE');
  }, []);

  const handleDateChange = useCallback(
    (date, workoutId) => {
      if (date instanceof Date && !isNaN(date)) {
        const dateKey = date.toDateString();
        const navigationKey = `${dateKey}-${workoutId}`;
        if (
          lastNavigation.current.date === dateKey &&
          lastNavigation.current.workoutId === workoutId
        ) {
          console.log('Duplicate navigation detected, skipping:', navigationKey);
          return;
        }
        lastNavigation.current = { date: dateKey, workoutId };
        console.log('Выбрана дата в handleDateChange:', date);
        setSelectedDate(date);
        onDateSelect(date, workoutId);
      } else {
        console.error('Invalid date:', date);
      }
    },
    [onDateSelect]
  );

  const handleCalendarClick = useCallback(() => {
    if (dateSelectorRef.current) {
      dateSelectorRef.current.toggleCalendar();
    }
  }, []);

  const toggleDropdown = useCallback((workoutKey) => {
    setShowDropdown((prev) => (prev === workoutKey ? null : workoutKey));
  }, []);

  const handleDeleteWorkout = useCallback(
    async (date, workoutId) => {
      try {
        const formattedDate = formatDateToLocal(new Date(date));
        await deleteWorkout(workoutId, formattedDate, authToken);
        setShowDropdown(null);
        setError(null);
        onDataUpdate();
      } catch (error) {
        console.error('Ошибка при удалении тренировки:', error);
        setError(error.message || 'Не удалось удалить тренировку. Попробуйте снова.');
      }
    },
    [authToken, formatDateToLocal, onDataUpdate]
  );

  const handleCopyWorkout = useCallback((date, workoutId) => {
    setWorkoutToCopy({ date, workoutId });
    setShowDatePicker(true);
  }, []);

  const handleDateSelectForCopy = useCallback(
    async (newDate) => {
      if (!newDate || isNaN(newDate)) {
        console.error('Invalid target date for copy:', newDate);
        setError('Пожалуйста, выберите действительную дату.');
        return;
      }
      const formattedSourceDate = formatDateToLocal(new Date(workoutToCopy.date));
      const formattedTargetDate = formatDateToLocal(newDate);
      try {
        await copyWorkout(formattedSourceDate, workoutToCopy.workoutId, formattedTargetDate, authToken);
        setShowDatePicker(false);
        setWorkoutToCopy(null);
        setError(null);
        onDataUpdate();
      } catch (error) {
        console.error('Ошибка при копировании тренировки:', error);
        setError(error.message || 'Не удалось скопировать тренировку. Попробуйте снова.');
      }
    },
    [authToken, formatDateToLocal, onDataUpdate, workoutToCopy]
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const totalItems = filteredWorkoutData.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const maxPagesToShow = window.innerWidth <= 375 ? 3 : window.innerWidth <= 768 ? 5 : 7;
    const pages = [];

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      const sidePages = Math.floor((maxPagesToShow - 3) / 2);
      let startPage = Math.max(2, currentPage - sidePages);
      let endPage = Math.min(totalPages - 1, currentPage + sidePages);

      if (endPage - startPage + 2 < maxPagesToShow - 2) {
        if (currentPage < totalPages / 2) {
          endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 3);
        } else {
          startPage = Math.max(2, endPage - maxPagesToShow + 3);
        }
      }

      if (startPage > 2) {
        pages.push('...');
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  if (loading) {
    return <Spinner darkMode={darkMode} />;
  }

  const filteredWorkoutData = Object.entries(workoutData)
    .flatMap(([date, workouts]) =>
      workouts.map((workout) => ({
        date,
        workoutId: workout.workoutId,
        title: workout.title,
        exerciseCount: workout.exercises.length,
      }))
    )
    .filter((data) => data.exerciseCount > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date) || b.workoutId - a.workoutId);

  const workoutsByDate = Object.entries(workoutData).reduce((acc, [date, workouts]) => {
    acc[date] = workouts;
    return acc;
  }, {});

  const highlightedDates = filteredWorkoutData.map((data) => new Date(data.date).setHours(0, 0, 0, 0));

  const renderDayContents = (day, date) => {
    const dateTime = date.setHours(0, 0, 0, 0);
    const isFilled = highlightedDates.includes(dateTime);

    return (
      <div
        style={{
          backgroundColor: isFilled ? '#000' : 'transparent',
          color: isFilled ? 'white' : '',
          borderRadius: isFilled ? '50%' : '',
          padding: '5px',
        }}
      >
        {day}
      </div>
    );
  };

  const hasWorkouts = filteredWorkoutData.length > 0;
  const totalPages = Math.ceil(filteredWorkoutData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentWorkouts = filteredWorkoutData.slice(startIndex, endIndex);

  return (
    <div className={styles.homeContainer}>
      {error && <div className={styles.errorMessage}>{error}</div>}
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
          {currentWorkouts.map(({ date, workoutId, title, exerciseCount }) => {
            const workoutsForDate = workoutsByDate[date] || [];
            const showWorkoutNumber = workoutsForDate.length > 1;
            const workoutKey = `${date}-${workoutId}`;

            return (
              <div
                key={workoutKey}
                className={styles.workoutBlock}
                role="button"
                tabIndex="0"
                onKeyDown={(e) => e.key === 'Enter' && handleDateChange(new Date(date), workoutId)}
              >
                <div className={styles.workoutBlockContent} onClick={() => handleDateChange(new Date(date), workoutId)}>
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
                <div className={styles.dropdownContainer} ref={showDropdown === workoutKey ? dropdownRef : null}>
                  <button
                    className={styles.moreButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown(workoutKey);
                    }}
                  >
                    <img src={settingIcon} alt="Settings" className={styles.settingIcon} />
                  </button>
                  {showDropdown === workoutKey && (
                    <div className={styles.dropdownMenu}>
                      <button
                        className={styles.dropdownItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyWorkout(date, workoutId);
                        }}
                      >
                        <span>Копировать</span>
                        <img
                          src={darkMode ? copyIconWhite : copyIconBlack}
                          alt="Copy"
                          className={styles.actionIcon}
                        />
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkout(date, workoutId);
                        }}
                      >
                        <span>Удалить</span>
                        <img
                          src={darkMode ? deleteIconWhite : deleteIconBlack}
                          alt="Delete"
                          className={styles.actionIcon}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Предыдущая страница"
              >
                <img
                  src={arrowLeft}
                  alt="Предыдущая страница"
                  className={styles.paginationIcon}
                />
              </button>
              <div className={styles.pageNumbers}>
                {getPageNumbers().map((page, index) =>
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      className={`${styles.paginationPageButton} ${currentPage === page ? styles.activePage : ''}`}
                      onClick={() => handlePageChange(page)}
                      aria-label={`Страница ${page}`}
                      aria-current={currentPage === page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Следующая страница"
              >
                <img
                  src={arrowRight}
                  alt="Следующая страница"
                  className={styles.paginationIcon}
                />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.noWorkouts}>
          <img src={darkMode ? lineWhite : lineBlack} alt="Линия" className={styles.lineIcon} />
          <h1 className={styles.noWorkoutsMessage}>Создайте свою тренировку через календарь</h1>
        </div>
      )}
      {showDatePicker && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} ref={modalRef}>
            <button
              className={styles.closeButton}
              onClick={() => {
                setShowDatePicker(false);
                setWorkoutToCopy(null);
                setError(null);
              }}
            >
              <img
                src={darkMode ? closeIconWhite : closeIconBlack}
                alt="Закрыть"
                className={styles.closeIcon}
              />
            </button>
            <h2>Выберите дату для копирования тренировки</h2>
            <DatePicker
              selected={new Date()}
              onChange={handleDateSelectForCopy}
              inline
              locale="ru"
              dateFormat="dd.MM.yyyy"
              calendarClassName="custom-datepicker"
              renderDayContents={renderDayContents}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;