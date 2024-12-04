import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import WorkoutTable from './WorkoutTable';
import Spinner from './Spinner';
import styles from './WorkoutPage.module.css';

const WorkoutPage = ({ workoutData, selectedDate, onDateSelect, onWorkoutChange, onTitleChange, loading, darkMode }) => {
  const { date } = useParams();
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  useEffect(() => {
    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);
    const localDate = new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000);

    if (!isNaN(localDate) && localDate.getTime() !== selectedDate.getTime()) {
      onDateSelect(localDate);
    } else if (isNaN(localDate)) {
      console.error('Invalid date format:', date);
    }
  }, [date, onDateSelect, selectedDate]);

  useEffect(() => {
    const currentWorkout = workoutData[selectedDate.toDateString()] || {};
    setWorkoutTitle(currentWorkout.title || '');
  }, [selectedDate, workoutData]);

  const handleTitleSave = () => {
    const updatedWorkoutData = {
      ...workoutData,
      [selectedDate.toDateString()]: {
        ...workoutData[selectedDate.toDateString()],
        title: workoutTitle,
      },
    };

    console.log('Workout data to save:', updatedWorkoutData[selectedDate.toDateString()]);
    onTitleChange(workoutTitle);
    setIsEditingTitle(false);
  };

  if (loading) {
    return <Spinner darkMode={darkMode} />;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.dateTitle}>Тренировка на {selectedDate.toLocaleDateString()}</h1>

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
          <h2
            onClick={() => setIsEditingTitle(true)}
            className={styles.editableTitle}
          >
            {workoutTitle || 'Введите название тренировки'}
          </h2>
        )}
      </div>

      <WorkoutTable
        date={selectedDate}
        workoutData={workoutData[selectedDate.toDateString()]?.exercises || []}
        onWorkoutChange={onWorkoutChange}
      />
    </div>
  );
};

export default WorkoutPage;
