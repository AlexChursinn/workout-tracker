// src/hooks/useWorkoutTable.js
import { useState, useEffect } from 'react';

export const useWorkoutTable = (initialWorkoutData, onWorkoutChange) => {
  const [workouts, setWorkouts] = useState(Array.isArray(initialWorkoutData) ? initialWorkoutData : []);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    setWorkouts(Array.isArray(initialWorkoutData) ? initialWorkoutData : []);
  }, [initialWorkoutData]);

  const handleWorkoutUpdate = (updatedWorkouts) => {
    console.log('Updated workouts:', updatedWorkouts); // Отладочное сообщение
    setWorkouts(updatedWorkouts);
    onWorkoutChange(updatedWorkouts);
  };

  const handleAddRow = () => {
    handleWorkoutUpdate([
      ...workouts,
      { id: workouts.length + 1, muscleGroup: '', exercise: '', sets: [null] }
    ]);
  };

  const handleDeleteRow = (workoutId) => {
    const updatedWorkouts = workouts
      .filter((workout) => workout.id !== workoutId)
      .map((workout, index) => ({ ...workout, id: index + 1 }));
    handleWorkoutUpdate(updatedWorkouts);
  };

  const handleCellClick = (workoutId, setIndex) => {
    setModalData({ workoutId, setIndex });
  };

  const updateWorkout = (workoutId, setIndex, reps, weight) => {
    const updatedWorkouts = workouts.map((workout) =>
      workout.id === workoutId
        ? { ...workout, sets: workout.sets.map((set, i) => (i === setIndex ? { reps, weight } : set)) }
        : workout
    );
    handleWorkoutUpdate(updatedWorkouts);
    setModalData(null);
  };

  const handleAddSet = (workoutId) => {
    const updatedWorkouts = workouts.map((workout) =>
      workout.id === workoutId
        ? { ...workout, sets: [...workout.sets, null] }
        : workout
    );
    handleWorkoutUpdate(updatedWorkouts);
  };

  const handleDeleteSet = (workoutId) => {
    const updatedWorkouts = workouts.map((workout) =>
      workout.id === workoutId && workout.sets.length > 1
        ? { ...workout, sets: workout.sets.slice(0, -1) }
        : workout
    );
    handleWorkoutUpdate(updatedWorkouts);
  };

  const handleCopySet = (workoutId) => {
    const updatedWorkouts = workouts.map((workout) => {
      if (workout.id === workoutId && workout.sets.length > 0) {
        const lastSet = workout.sets[workout.sets.length - 1];
        const newSet = lastSet && lastSet.reps !== undefined && lastSet.weight !== undefined 
          ? { ...lastSet } 
          : null;
        workout.sets = [...workout.sets, newSet];
      }
      return workout;
    });
    handleWorkoutUpdate(updatedWorkouts);
  };

  return {
    workouts,
    modalData,
    handleAddRow,
    handleDeleteRow,
    handleCellClick,
    updateWorkout,
    handleAddSet,
    handleDeleteSet,
    handleCopySet,
    setModalData
  };
};
