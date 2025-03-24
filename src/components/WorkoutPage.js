import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WorkoutTable from './WorkoutTable';
import Spinner from './Spinner';
import styles from './WorkoutPage.module.css';

const WorkoutPage = ({ workoutData, selectedDate, onDateSelect, onWorkoutChange, onTitleChange, loading, darkMode, defaultMuscleGroups, customMuscleGroups }) => {
  const { date, workoutId } = useParams();
  const [workoutTitle, setWorkoutTitle] = useState('');
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
  }, [selectedDate, workoutData, workoutId]);

  const handleTitleSave = () => {
    onTitleChange(workoutTitle, parseInt(workoutId));
    setIsEditingTitle(false);
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
        onWorkoutChange={(data) => onWorkoutChange(data, parseInt(workoutId))}
        defaultMuscleGroups={defaultMuscleGroups}
        customMuscleGroups={customMuscleGroups}
        darkMode={darkMode}
      />
      <button onClick={handleAddNewWorkout} className={styles.addWorkoutButton}>
        Добавить еще одну тренировку
      </button>
    </div>
  );
};

export default WorkoutPage; 