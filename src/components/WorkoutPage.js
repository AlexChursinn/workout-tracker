import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WorkoutTable from './WorkoutTable';
import Spinner from './Spinner';
import weightIconLight from '../assets/weight-icon-light.svg';
import weightIconDark from '../assets/weight-icon-dark.svg';
import styles from './WorkoutPage.module.css';

const WorkoutPage = ({ workoutData, selectedDate, onDateSelect, onWorkoutChange, onTitleChange, loading, darkMode, defaultMuscleGroups, customMuscleGroups, authToken }) => {
  const { date, workoutId } = useParams();
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [bodyWeight, setBodyWeight] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);
    const localDate = new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000);
    if (!isNaN(localDate) && localDate.getTime() !== selectedDate.getTime()) {
      onDateSelect(localDate, parseInt(workoutId));
    }
  }, [date, workoutId, onDateSelect, selectedDate]);

  useEffect(() => {
    const workoutsForDate = workoutData[selectedDate.toDateString()] || [];
    const currentWorkout = workoutsForDate.find((w) => w.workoutId === parseInt(workoutId)) || {};
    setWorkoutTitle(currentWorkout.title || '');
    setBodyWeight(currentWorkout.bodyWeight || '');
  }, [selectedDate, workoutData, workoutId]);

  const handleTitleSave = () => {
    onTitleChange(workoutTitle, parseInt(workoutId));
    setIsEditingTitle(false);
  };

  const handleBodyWeightChange = (e) => {
    const value = e.target.value;
    if (value.length <= 3 && /^\d*\.?\d*$/.test(value)) {
      setBodyWeight(value);
      const workoutsForDate = workoutData[selectedDate.toDateString()] || [];
      const currentWorkout = workoutsForDate.find((w) => w.workoutId === parseInt(workoutId)) || {};
      onWorkoutChange(currentWorkout.exercises || [], parseInt(workoutId), value);
    }
  };

  const handleAddNewWorkout = () => {
    const workoutsForDate = workoutData[selectedDate.toDateString()] || [];
    const newWorkoutId = workoutsForDate.length + 1;
    const formattedDate = selectedDate.toISOString().split('T')[0];
    navigate(`/${formattedDate}/${newWorkoutId}`);
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
        onWorkoutChange={(data) => onWorkoutChange(data, parseInt(workoutId), bodyWeight)}
        defaultMuscleGroups={defaultMuscleGroups}
        customMuscleGroups={customMuscleGroups}
        darkMode={darkMode}
      />
      <div className={styles.workoutBlock}>
        <button onClick={handleAddNewWorkout} className={styles.addWorkoutButton}>
          Добавить еще одну тренировку
        </button>
      </div>
      <div className={styles.workoutBlock}>
        <h3 className={styles.bodyWeightTitle}>Вес тела</h3>
        <div className={styles.bodyWeightContainer}>
          <img
            src={darkMode ? weightIconLight : weightIconLight}
            alt="Weight Icon"
            className={styles.weightIcon}
          />
          <input
            type="number"
            id="bodyWeight"
            value={bodyWeight}
            onChange={handleBodyWeightChange}
            placeholder="Введите ваш вес (кг)"
            className={styles.bodyWeightInput}
            min="0"
            step="0.1"
            maxLength="3"
          />
        </div>
      </div>
    </div>
  );
};

export default WorkoutPage;
