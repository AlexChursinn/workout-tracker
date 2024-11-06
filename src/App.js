import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import DateSelector from './components/DateSelector';
import WorkoutTable from './components/WorkoutTable';
import Footer from './components/Footer';
import Analytics from './components/Analytics';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './ProtectedRoute';
import { getWorkouts, addWorkout } from './api';
import './global.css';
import './App.css';

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
  const navigate = useNavigate();
  const location = useLocation();

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
      const token = authToken;
      if (!token) {
        setWorkoutData({});
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
    }
  };

  useEffect(() => {
    if (isAuthenticated && authToken) {
      fetchData();
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

      await addWorkout(newWorkout, token);
      fetchData();
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
    }
  };

  const filledDates = Object.keys(workoutData).filter(
    (date) => workoutData[date] && workoutData[date].length > 0
  );

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="container">
      <Header darkMode={darkMode} toggleTheme={toggleTheme} onLogout={handleLogout} showLogoutButton={!isAuthPage} />
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute key={isAuthenticated}>
              <>
                <DateSelector
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  filledDates={filledDates}
                />
                {showTable && (
                  <WorkoutTable
                    date={selectedDate}
                    workoutData={workoutData[selectedDate.toDateString()] || []}
                    onWorkoutChange={handleWorkoutChange}
                  />
                )}
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      {!isAuthPage && (
        <Footer darkMode={darkMode} onNavigateToday={() => handleDateSelect(new Date())} />
      )}
    </div>
  );
};

export default App;
