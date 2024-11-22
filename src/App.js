import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import Header from './components/Header';
import WorkoutPage from './components/WorkoutPage';
import Footer from './components/Footer';
import Analytics from './components/Analytics';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './ProtectedRoute';
import Home from './components/Home';
import { getWorkouts, addWorkout, refreshAuthToken, loginWithTelegram } from './api';
import './global.css';

const App = () => {
  // Устанавливаем темную тему по умолчанию
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode !== null ? savedMode === 'true' : true; // Темная тема включена по умолчанию
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    const savedDate = localStorage.getItem('selectedDate');
    return savedDate ? new Date(savedDate) : new Date();
  });
  const [showTable, setShowTable] = useState(() => localStorage.getItem('showTable') === 'true');
  const [workoutData, setWorkoutData] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('jwt'));
  const [authToken, setAuthToken] = useState(localStorage.getItem('jwt') || null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Проверяем, запущено ли приложение через Telegram WebApp
  useEffect(() => {
    if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
      const telegramData = window.Telegram.WebApp.initDataUnsafe;

      if (telegramData?.user) {
        loginWithTelegram(telegramData.user)
          .then((token) => {
            setAuthToken(token);
            setIsAuthenticated(true);
            fetchData();
            console.log('Успешная авторизация через Telegram');
          })
          .catch((error) => {
            console.error('Ошибка авторизации через Telegram:', error);
          });
      }
    }
  }, []);

  const toggleTheme = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    setAuthToken(null);
    setWorkoutData({});
    setIsAuthenticated(false);
    navigate('/login');
  };

  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now(); // Проверка истечения срока действия
    } catch (error) {
      console.error('Ошибка при проверке токена:', error);
      return true; // Считаем токен истекшим в случае ошибки
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      if (authToken && isTokenExpired(authToken)) {
        const newToken = await refreshAuthToken();
        if (newToken) {
          setAuthToken(newToken);
          setIsAuthenticated(true);
        } else {
          handleLogout(); // Если обновление не удалось, выполняем выход
        }
      } else if (isAuthenticated && authToken) {
        fetchData();
      }
    };

    const interval = setInterval(checkAndRefreshToken, 1 * 60 * 1000); // Проверка каждые 15 минут

    checkAndRefreshToken(); // Первоначальная проверка при монтировании компонента

    return () => clearInterval(interval);
  }, [isAuthenticated, authToken]);

  useEffect(() => {
    localStorage.setItem('selectedDate', selectedDate.toISOString());
    localStorage.setItem('showTable', showTable);
  }, [selectedDate, showTable]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (authToken && isTokenExpired(authToken)) {
        const newToken = await refreshAuthToken();
        if (newToken) {
          setAuthToken(newToken);
        } else {
          handleLogout();
          return;
        }
      }

      const response = await getWorkouts(authToken);
      const { workouts } = response;
      const formattedData = workouts.reduce((acc, workout) => {
        acc[new Date(workout.workout_date).toDateString()] = workout.exercises || [];
        return acc;
      }, {});
      setWorkoutData(formattedData);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      if (error.message.includes('Unauthorized')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowTable(true);
  };

  const handleLogin = (token) => {
    localStorage.setItem('jwt', token);
    setAuthToken(token);
    setIsAuthenticated(true);
    setSelectedDate(new Date());
    fetchData();
  };

  const handleWorkoutChange = async (dataForDate) => {
    try {
      const token = authToken;
      if (!token) return;

      const workoutDate = selectedDate.toISOString().split('T')[0];
      const newWorkout = {
        workout_date: workoutDate,
        exercises: dataForDate,
      };

      setWorkoutData((prevData) => ({
        ...prevData,
        [new Date(workoutDate).toDateString()]: dataForDate,
      }));

      await addWorkout(newWorkout, token);
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
    }
  };

  const filledDates = Object.keys(workoutData).filter(
    (date) => workoutData[date] && workoutData[date].length > 0
  );

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    const saveScrollPosition = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY);
    };

    window.addEventListener('beforeunload', saveScrollPosition);
    window.addEventListener('pagehide', saveScrollPosition);
    return () => {
      window.removeEventListener('beforeunload', saveScrollPosition);
      window.removeEventListener('pagehide', saveScrollPosition);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="container">
      <Header
        darkMode={darkMode}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
        showLogoutButton={!isAuthPage}
      />
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/:date"
          element={
            <ProtectedRoute>
              <WorkoutPage
                workoutData={workoutData}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                onWorkoutChange={handleWorkoutChange}
                loading={loading}
                darkMode={darkMode}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home workoutData={workoutData} onDateSelect={handleDateSelect} darkMode={darkMode} loading={loading} />
            </ProtectedRoute>
          }
        />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
      {!isAuthPage && (
        <Footer darkMode={darkMode} onNavigateToday={() => handleDateSelect(new Date())} />
      )}
    </div>
  );
};

export default App;
 