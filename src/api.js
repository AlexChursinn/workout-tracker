// src/api.js

const API_URL = 'http://localhost:3001/api'; // Убедитесь, что это соответствует адресу вашего локального сервера

// Функция для получения тренировок текущего пользователя
export const getWorkouts = async () => {
  try {
    const response = await fetch(`${API_URL}/user-workouts`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
      },
    });
    if (!response.ok) {
      throw new Error('Ошибка при загрузке тренировок');
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при загрузке тренировок:', error);
    throw error;
  }
};

// Функция для добавления новой тренировки
export const addWorkout = async (workout) => {
  try {
    const response = await fetch(`${API_URL}/user-workouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
      },
      body: JSON.stringify(workout),
    });
    if (!response.ok) {
      throw new Error('Ошибка при добавлении тренировки');
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при добавлении тренировки:', error);
    throw error;
  }
};

// Функция для регистрации нового пользователя
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ошибка регистрации');
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    throw error;
  }
};

// Функция для авторизации пользователя
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ошибка авторизации');
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при авторизации пользователя:', error);
    throw error;
  }
};
