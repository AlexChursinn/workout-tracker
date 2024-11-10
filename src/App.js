// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import WorkoutPage from './components/WorkoutPage';
import Footer from './components/Footer';
import Analytics from './components/Analytics';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './ProtectedRoute';
import Spinner from './components/Spinner';
import Home from './components/Home';
import { getWorkouts, addWorkout } from './api';
import './global.css';

const App = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
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

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = authToken;
      if (!token) {
        setWorkoutData({});
        setLoading(false);
        return;
      }

      const response = await getWorkouts(token);
      const { workouts } = response;
      const formattedData = workouts.reduce((acc, workout) => {
        acc[new Date(workout.workout_date).toDateString()] = workout.exercises || [];
        return acc;
      }, {});
      setWorkoutData(formattedData);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && authToken) {
      fetchData().then(() => {
        // Восстанавливаем положение прокрутки после загрузки данных
        const savedPosition = sessionStorage.getItem('scrollPosition');
        if (savedPosition !== null) {
          window.scrollTo(0, parseInt(savedPosition, 10));
        }
      });
    }
  }, [isAuthenticated, authToken]);

  useEffect(() => {
    localStorage.setItem('selectedDate', selectedDate.toISOString());
    localStorage.setItem('showTable', showTable);
  }, [selectedDate, showTable]);

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

  // Сохраняем положение прокрутки перед обновлением или уходом со страницы
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
              <Home workoutData={workoutData} onDateSelect={handleDateSelect} darkMode={darkMode} loading={loading}/>
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
