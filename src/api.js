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
      throw new Error('Ошибка при загрузке тренировок');
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
      throw new Error('Ошибка при добавлении тренировки');
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при добавлении тренировки:', error);
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
      throw new Error('Ошибка при загрузке пользовательских групп мышц');
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
      throw new Error('Ошибка при сохранении пользовательских групп мышц');
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

// Новая функция login для стандартной авторизации
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