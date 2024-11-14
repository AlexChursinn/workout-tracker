// src/components/WorkoutPage.js
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import WorkoutTable from './WorkoutTable';
import Spinner from './Spinner';

const WorkoutPage = ({ workoutData, selectedDate, onDateSelect, onWorkoutChange, loading, darkMode }) => {
  const { date } = useParams();

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

  if (loading) {
    return <Spinner darkMode={darkMode} />;
  }

  return (
    <div>
      <h1>Тренировка на {selectedDate.toLocaleDateString()}</h1>
      <WorkoutTable
        date={selectedDate}
        workoutData={workoutData[selectedDate.toDateString()] || []}
        onWorkoutChange={onWorkoutChange}
      />
    </div>
  );
};

export default WorkoutPage;
 