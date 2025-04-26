const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const getWorkouts = async (token) => {
  try {
    let response = await fetch(`${API_URL}/user-workouts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      const newToken = await refreshAuthToken();
      if (newToken) {
        response = await fetch(`${API_URL}/user-workouts`, {
          headers: {
            'Authorization': `Bearer ${newToken}`,
          },
        });
      } else {
        throw new Error('Токен истек и не удалось обновить его');
      }
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Ошибка при загрузке тренировок: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при загрузке тренировок:', error);
    throw error;
  }
};

export const addWorkout = async (workout, token) => {
  try {
    const response = await fetch(`${API_URL}/user-workouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(workout),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Ошибка при добавлении тренировки: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при добавлении тренировки:', error);
    throw error;
  }
};

export const deleteWorkout = async (workoutId, workout_date, token) => {
  try {
    console.log('Sending DELETE request:', {
      url: `${API_URL}/user-workouts/${workoutId}?workout_date=${workout_date}`,
      token: token ? 'Token present' : 'No token',
    });
    const response = await fetch(`${API_URL}/user-workouts/${workoutId}?workout_date=${workout_date}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Ошибка при удалении тренировки: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при удалении тренировки:', error);
    throw error;
  }
};

export const copyWorkout = async (source_workout_date, source_workoutId, target_workout_date, token) => {
  try {
    console.log('Sending POST request to copy workout:', {
      source_workout_date,
      source_workoutId,
      target_workout_date,
      token: token ? 'Token present' : 'No token',
    });
    const response = await fetch(`${API_URL}/user-workouts/copy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ source_workout_date, source_workoutId, target_workout_date }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Ошибка при копировании тренировки: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при копировании тренировки:', error);
    throw error;
  }
};

export const getCustomMuscleGroups = async (token) => {
  try {
    const response = await fetch(`${API_URL}/user-muscle-groups`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Ошибка при загрузке пользовательских групп мышц: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при загрузке пользовательских групп мышц:', error);
    throw error;
  }
};

export const saveCustomMuscleGroups = async (customMuscleGroups, token) => {
  try {
    const response = await fetch(`${API_URL}/user-muscle-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ muscleGroups: customMuscleGroups }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Ошибка при сохранении пользовательских групп мышц: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при сохранении пользовательских групп мышц:', error);
    throw error;
  }
};

export const loginWithTelegram = async (telegramData) => {
  try {
    const response = await fetch(`${API_URL}/telegram-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telegramData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ошибка авторизации через Telegram');
    }

    const { token } = await response.json();
    localStorage.setItem('jwt', token);
    return token;
  } catch (error) {
    console.error('Ошибка при авторизации через Telegram:', error);
    throw error;
  }
};

export const refreshAuthToken = async () => {
  try {
    const response = await fetch(`${API_URL}/refresh-token`, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('jwt', data.accessToken);
      return data.accessToken;
    } else {
      console.error('Ошибка при обновлении токена');
      return null;
    }
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error);
    return null;
  }
};

export const login = async (credentials) => {
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

    const { token } = await response.json();
    localStorage.setItem('jwt', token);
    return token;
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    throw error;
  }
};