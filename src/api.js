const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Функция для получения тренировок текущего пользователя
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
    console.log('Workout being sent to server:', workout); // Логируем данные перед отправкой
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



// Функция для авторизации через Telegram WebApp
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
    localStorage.setItem('jwt', token); // Сохраняем токен в localStorage
    return token;
  } catch (error) {
    console.error('Ошибка при авторизации через Telegram:', error);
    throw error;
  }
};

// Функция для обновления токена
export const refreshAuthToken = async () => {
  try {
    const response = await fetch(`${API_URL}/refresh-token`, {
      method: 'POST',
      credentials: 'include', // Используется, если refresh token хранится в httpOnly cookie
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('jwt', data.accessToken); // Сохраняем новый токен в localStorage
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
    