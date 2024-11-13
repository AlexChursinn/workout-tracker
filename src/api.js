const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Функция для получения тренировок текущего пользователя
export const getWorkouts = async (token) => {
  try {
    console.log('Токен для запроса (getWorkouts):', token?.trim());
    if (!token || token.split('.').length !== 3) {
      throw new Error('Некорректный формат токена');
    }

    let response = await fetch(`${API_URL}/user-workouts`, {
      headers: {
        'Authorization': `Bearer ${token.trim()}`, // Убираем лишние пробелы
      },
    });

    if (response.status === 401) {
      console.warn('Токен истек. Попытка обновления...');
      const newToken = await refreshAuthToken();
      if (newToken) {
        response = await fetch(`${API_URL}/user-workouts`, {
          headers: {
            'Authorization': `Bearer ${newToken.trim()}`,
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

// Функция для добавления новой тренировки
export const addWorkout = async (workout, token) => {
  try {
    console.log('Токен для запроса (addWorkout):', token?.trim());
    if (!token || token.split('.').length !== 3) {
      throw new Error('Некорректный формат токена');
    }

    const response = await fetch(`${API_URL}/user-workouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.trim()}`,
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

// Функция для обновления токена
export const refreshAuthToken = async () => {
  try {
    console.log('Попытка обновления токена...');

    const response = await fetch(`${API_URL}/refresh-token`, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Обновленный токен:', data.accessToken);
      if (data.accessToken && data.accessToken.split('.').length === 3) {
        localStorage.setItem('jwt', data.accessToken);
        return data.accessToken;
      } else {
        throw new Error('Получен некорректный формат токена при обновлении');
      }
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
    console.log('Попытка регистрации пользователя...');

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
    console.log('Попытка авторизации пользователя...');

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

    const data = await response.json();
    console.log('Получен токен при авторизации:', data.token);
    if (data.token && data.token.split('.').length === 3) {
      localStorage.setItem('jwt', data.token);
    } else {
      throw new Error('Получен некорректный формат токена при авторизации');
    }
    return data;
  } catch (error) {
    console.error('Ошибка при авторизации пользователя:', error);
    throw error;
  }
};
