import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WorkoutTable from './WorkoutTable';
import Spinner from './Spinner';
import weightIconLight from '../assets/weight-icon-light.svg';
import noteIconLight from '../assets/note-icon-light.svg';
import styles from './WorkoutPage.module.css';

const WorkoutPage = ({ workoutData, selectedDate, onDateSelect, onWorkoutChange, onTitleChange, loading, darkMode, defaultMuscleGroups, customMuscleGroups, authToken }) => {
  const { date, workoutId } = useParams();
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [bodyWeight, setBodyWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [notesError, setNotesError] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [inputWidth, setInputWidth] = useState(null);
  const inputRef = useRef(null);
  const textMeasureRef = useRef(null);
  const navigate = useNavigate();
  const hasSynced = useRef(false);

  useEffect(() => {
    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);
    const localDate = new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000);
    if (
      !hasSynced.current &&
      !isNaN(localDate) &&
      localDate.toDateString() !== selectedDate.toDateString()
    ) {
      hasSynced.current = true;
      onDateSelect(localDate, parseInt(workoutId));
    }
  }, [date, workoutId, onDateSelect, selectedDate]);

  useEffect(() => {
    const workoutsForDate = workoutData[selectedDate.toDateString()] || [];
    const currentWorkout = workoutsForDate.find((w) => w.workoutId === parseInt(workoutId)) || {};
    setWorkoutTitle(currentWorkout.title || '');
    setBodyWeight(currentWorkout.bodyWeight || '');
    setNotes(currentWorkout.notes || '');
    hasSynced.current = false; // Reset for future navigations
  }, [selectedDate, workoutData, workoutId]);

  useEffect(() => {
    if (textMeasureRef.current && inputRef.current) {
      const textWidth = textMeasureRef.current.offsetWidth;
      setInputWidth(textWidth + 20);
    }
  }, [bodyWeight]);

  const handleTitleSave = () => {
    onTitleChange(workoutTitle, parseInt(workoutId));
    setIsEditingTitle(false);
  };

  const handleBodyWeightChange = (e) => {
    const value = e.target.value;
    if (value === '' || (/^\d{0,3}(\.\d{0,2})?$/.test(value) && parseInt(value.split('.')[0] || 0) <= 999)) {
      setBodyWeight(value);
      const workoutsForDate = workoutData[selectedDate.toDateString()] || [];
      const currentWorkout = workoutsForDate.find((w) => w.workoutId === parseInt(workoutId)) || {};
      onWorkoutChange(currentWorkout.exercises || [], parseInt(workoutId), value, currentWorkout.notes || '');
    }
  };

  const handleNotesChange = (e) => {
    const value = e.target.value;
    if (value.length <= 500) {
      setNotes(value);
      setNotesError('');
      const workoutsForDate = workoutData[selectedDate.toDateString()] || [];
      const currentWorkout = workoutsForDate.find((w) => w.workoutId === parseInt(workoutId)) || {};
      onWorkoutChange(currentWorkout.exercises || [], parseInt(workoutId), currentWorkout.bodyWeight || '', value);
    } else {
      setNotesError('Максимальная длина заметки — 500 символов');
    }
  };

  const handleAddNewWorkout = () => {
    const workoutsForDate = workoutData[selectedDate.toDateString()] || [];
    const newWorkoutId = workoutsForDate.length + 1;
    navigate(`/${date}/${newWorkoutId}`); // Используем date из URL вместо selectedDate
  };

  if (loading) return <Spinner darkMode={darkMode} />;

  const workoutsForDate = workoutData[selectedDate.toDateString()] || [];
  const currentWorkout = workoutsForDate.find((w) => w.workoutId === parseInt(workoutId)) || {};

  return (
    <div className={styles.container}>
      <h1 className={styles.dateTitle}>Тренировка на {selectedDate.toLocaleDateString()}</h1>
      <h3 className={styles.workoutNumber}>Тренировка №{workoutId}</h3>
      <div>
        {isEditingTitle ? (
          <input
            type="text"
            value={workoutTitle}
            onChange={(e) => setWorkoutTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            autoFocus
            className={styles.inputTitle}
            placeholder="Введите название тренировки"
          />
        ) : (
          <h2 onClick={() => setIsEditingTitle(true)} className={styles.editableTitle}>
            {workoutTitle || 'Введите название тренировки'}
          </h2>
        )}
      </div>
      <WorkoutTable
        date={selectedDate}
        workoutData={currentWorkout.exercises || []}
        onWorkoutChange={(data) => onWorkoutChange(data, parseInt(workoutId), bodyWeight, notes)}
        defaultMuscleGroups={defaultMuscleGroups}
        customMuscleGroups={customMuscleGroups}
        darkMode={darkMode}
      />
      {currentWorkout.exercises?.length > 0 && (
        <div className={styles.workoutBlock}>
          <button onClick={handleAddNewWorkout} className={styles.addWorkoutButton}>
            Добавить еще одну тренировку
          </button>
        </div>
      )}
      <div className={styles.workoutBlock}>
        <h3 className={styles.bodyWeightTitle}>Вес тела</h3>
        <div className={styles.bodyWeightContainer}>
          <img
            src={weightIconLight}
            alt="Weight Icon"
            className={styles.weightIcon}
          />
          <div className={styles.inputWrapper}>
            <input
              type="number"
              id="bodyWeight"
              value={bodyWeight}
              onChange={handleBodyWeightChange}
              placeholder="Введите ваш вес (кг)"
              className={styles.bodyWeightInput}
              min="0"
              step="0.01"
              ref={inputRef}
              style={{ width: inputWidth ? `${inputWidth}px` : 'auto' }}
            />
            <span className={styles.hiddenText} ref={textMeasureRef}>
              {bodyWeight || 'Введите ваш вес (кг)'}
            </span>
          </div>
          {bodyWeight && <span className={styles.weightUnit}>кг</span>}
        </div>
      </div>
      <div className={styles.workoutBlock}>
        <h3 className={styles.bodyWeightTitle}>Заметки</h3>
        <div className={styles.notesContainer}>
          <img
            src={noteIconLight}
            alt="Note Icon"
            className={styles.noteIcon}
          />
          <div className={styles.notesInputWrapper}>
            <textarea
              id="notes"
              value={notes}
              onChange={handleNotesChange}
              placeholder="Введите ваши заметки"
              className={`${styles.notesInput} ${notesError ? styles.error : ''}`}
            />
            {notesError && <span className={styles.errorMessage}>{notesError}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPage;