// src/api.js
const API_URL = 'https://workout-tracker-hljr.onrender.com/api';

export const getWorkouts = async () => {
  const response = await fetch(`${API_URL}/workouts`);
  if (!response.ok) throw new Error('Ошибка при загрузке тренировок');
  return response.json();
};

export const addWorkout = async (workout) => {
  const response = await fetch(`${API_URL}/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workout),
  });
  if (!response.ok) throw new Error('Ошибка при добавлении тренировки');
  return response.json();
};
