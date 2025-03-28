import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group'; // Добавлены импорты
import { jwtDecode } from 'jwt-decode';
import Header from './components/Header';
import WorkoutPage from './components/WorkoutPage';
import Footer from './components/Footer';
import Analytics from './components/Analytics';
import Exercises from './components/Exercises';
import Settings from './components/Settings';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './ProtectedRoute';
import Home from './components/Home';
import { getWorkouts, addWorkout, refreshAuthToken, loginWithTelegram, getCustomMuscleGroups, saveCustomMuscleGroups } from './api';
import './global.css';

const defaultMuscleGroups = {
  "Грудь": ["Жим штанги лежа Горизонт", "Жим штанги лежа 45", "Жим штанги лежа Низ", "Жим гантелей 15", "Жим гантелей 30", "Жим гантелей 45", "Брусья", "Разводка гантелей Горизонт", "Разводка гантелей 15", "Сведение рук в кроссовере", "Бабочка", "Отжимания"],
  "Спина": ["Тяга верхнего блока", "Тяга одной рукой в тренажере", "Тяга горизонтального блока", "Тяга одной рукой в наклоне", "Тяга гантели одной рукой в наклоне", "Тяга штанги в наклоне", "Становая тяга", "Подтягивания", "Вис на турнике"],
  "Ноги": ["Присед", "Разгибание ног", "Задняя поверхность бедра (стоя одной ногой в тренажере)", "Задняя поверхность бедра (Двумя ногами)", "Выпады с гантелями", "Жим ногами в тренажере"],
  "Руки": ["Подъем гантелей на скамье 45", "Изогнутый гриф на скамье Скотта", "Скамья Скотта тренажер", "Молотки сидя на скамье", "Молотки стоя", "Подъем прямого грифа стоя", "Подъем изогнутого грифа"],
  "Плечи": ["Жим штанги сидя на скамье", "Жим гантелей сидя на скамье", "Подъем гантелей перед собой сидя на скамье на плечи", "Подъем гантелей в стороны стоя Махи", "Задняя дельта сидя на скамье", "Тяга к подбородку", "Подъем гантелей на трапецию стоя"],
  "Прочее": ["Гиперэкстензия", "Растяжка 30 сек", "Растяжка 1 минута", "Пресс (турник)", "Пресс (брусья)", "Икры со штангой в двух вариациях", "Икры в тренажере", "Икры со штангой", "Икры стоя"]
};

const App = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    return savedDarkMode !== null ? savedDarkMode === 'true' : true;
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date(localStorage.getItem('selectedDate') || Date.now()));
  const [showTable, setShowTable] = useState(() => localStorage.getItem('showTable') === 'true');
  const [workoutData, setWorkoutData] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('jwt'));
  const [authToken, setAuthToken] = useState(localStorage.getItem('jwt') || null);
  const [loading, setLoading] = useState(true);
  const [customMuscleGroups, setCustomMuscleGroups] = useState({});

  const location = useLocation();
  const navigate = useNavigate();

  // Прокрутка вверх при смене маршрута
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Сохранение и восстановление позиции прокрутки при перезагрузке
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY);
    };

    const restoreScrollPosition = () => {
      const scrollPosition = sessionStorage.getItem('scrollPosition');
      if (scrollPosition) {
        window.scrollTo(0, parseInt(scrollPosition, 10));
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('load', restoreScrollPosition);

    // Восстановить позицию при первой загрузке
    restoreScrollPosition();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('load', restoreScrollPosition);
    };
  }, []);

  useEffect(() => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      loginWithTelegram(window.Telegram.WebApp.initDataUnsafe.user)
        .then((token) => {
          setAuthToken(token);
          setIsAuthenticated(true);
          fetchData(token);
        })
        .catch((error) => console.error('Ошибка авторизации через Telegram:', error));
    } else if (isAuthenticated && authToken) {
      fetchData(authToken);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, authToken]);

  useEffect(() => {
    if (darkMode) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      if (authToken && isTokenExpired(authToken)) {
        const newToken = await refreshAuthToken();
        if (newToken) {
          setAuthToken(newToken);
          localStorage.setItem('jwt', newToken);
          setIsAuthenticated(true);
          fetchData(newToken);
        } else {
          handleLogout();
        }
      }
    };
    const interval = setInterval(checkAndRefreshToken, 15 * 60 * 1000);
    checkAndRefreshToken();
    return () => clearInterval(interval);
  }, [authToken]);

  useEffect(() => {
    localStorage.setItem('selectedDate', selectedDate.toISOString());
    localStorage.setItem('showTable', showTable);
  }, [selectedDate, showTable]);

  const fetchData = async (token) => {
    try {
      setLoading(true);
      const [workoutsResponse, muscleGroupsResponse] = await Promise.all([
        getWorkouts(token),
        getCustomMuscleGroups(token),
      ]);
      const formattedData = workoutsResponse.workouts.reduce((acc, workout) => {
        const dateKey = new Date(workout.workout_date).toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push({
          workoutId: workout.workoutId,
          title: workout.title || '',
          exercises: workout.exercises || [],
        });
        return acc;
      }, {});
      setWorkoutData(formattedData);
      setCustomMuscleGroups(muscleGroupsResponse.muscleGroups || {});
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      if (error.message.includes('Unauthorized')) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date, workoutId = 1) => {
    setSelectedDate(date);
    setShowTable(true);
    const formattedDate = date.toISOString().split('T')[0];
    navigate(`/${formattedDate}/${workoutId}`);
  };

  const handleLogin = (token) => {
    localStorage.setItem('jwt', token);
    setAuthToken(token);
    setIsAuthenticated(true);
    setSelectedDate(new Date());
    fetchData(token);
  };

  const handleWorkoutChange = async (dataForDate, workoutId) => {
    try {
      const workoutDate = selectedDate.toISOString().split('T')[0];
      const currentWorkouts = workoutData[selectedDate.toDateString()] || [];
      const currentWorkout = currentWorkouts.find((w) => w.workoutId === workoutId) || {};
      const updatedWorkout = {
        workout_date: workoutDate,
        workoutId: workoutId || currentWorkouts.length + 1,
        title: currentWorkout.title || '',
        exercises: dataForDate.map((workout, index) => ({
          ...workout,
          number: workout.number || index + 1,
        })),
      };
      setWorkoutData((prevData) => ({
        ...prevData,
        [selectedDate.toDateString()]: [
          ...(prevData[selectedDate.toDateString()] || []).filter((w) => w.workoutId !== workoutId),
          updatedWorkout,
        ].sort((a, b) => a.workoutId - b.workoutId),
      }));
      await addWorkout(updatedWorkout, authToken);
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
    }
  };

  const handleTitleChange = async (newTitle, workoutId) => {
    try {
      const workoutDate = selectedDate.toISOString().split('T')[0];
      const currentWorkouts = workoutData[selectedDate.toDateString()] || [];
      const currentWorkout = currentWorkouts.find((w) => w.workoutId === workoutId) || {};
      const updatedWorkout = {
        workout_date: workoutDate,
        workoutId,
        title: newTitle,
        exercises: currentWorkout.exercises || [],
      };
      setWorkoutData((prevData) => ({
        ...prevData,
        [selectedDate.toDateString()]: [
          ...(prevData[selectedDate.toDateString()] || []).filter((w) => w.workoutId !== workoutId),
          updatedWorkout,
        ].sort((a, b) => a.workoutId - b.workoutId),
      }));
      await addWorkout(updatedWorkout, authToken);
    } catch (error) {
      console.error('Ошибка при сохранении названия тренировки:', error);
    }
  };

  const handleMuscleGroupsChange = async (newCustomGroups) => {
    setCustomMuscleGroups(newCustomGroups);
    try {
      await saveCustomMuscleGroups(newCustomGroups, authToken);
    } catch (error) {
      console.error('Ошибка при сохранении пользовательских групп мышц:', error);
    }
  };

  const toggleTheme = () => setDarkMode((prev) => !prev);

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    setAuthToken(null);
    setWorkoutData({});
    setCustomMuscleGroups({});
    setIsAuthenticated(false);
    navigate('/login');
  };

  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  };

  return (
    <div className="app">
      <Header
        darkMode={darkMode}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
        showLogoutButton={!['/login', '/register'].includes(location.pathname)}
      />
      <main className="container">
        <TransitionGroup>
          <CSSTransition
            key={location.pathname}
            timeout={300}
            classNames="page"
          >
            <Routes>
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register onLogin={handleLogin} />} />
              <Route
                path="/:date/:workoutId"
                element={
                  <ProtectedRoute>
                    <WorkoutPage
                      workoutData={workoutData}
                      selectedDate={selectedDate}
                      onDateSelect={handleDateSelect}
                      onWorkoutChange={handleWorkoutChange}
                      onTitleChange={handleTitleChange}
                      loading={loading}
                      darkMode={darkMode}
                      defaultMuscleGroups={defaultMuscleGroups}
                      customMuscleGroups={customMuscleGroups}
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
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics workoutData={workoutData} darkMode={darkMode} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exercises"
                element={
                  <ProtectedRoute>
                    <Exercises
                      darkMode={darkMode}
                      defaultMuscleGroups={defaultMuscleGroups}
                      customMuscleGroups={customMuscleGroups}
                      onMuscleGroupsChange={handleMuscleGroupsChange}
                      loading={loading}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings darkMode={darkMode} toggleTheme={toggleTheme} onLogout={handleLogout} />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
          </CSSTransition>
        </TransitionGroup>
      </main>
      {!['/login', '/register'].includes(location.pathname) && (
        <Footer darkMode={darkMode} onNavigateToday={() => handleDateSelect(new Date())} />
      )}
    </div>
  );
};

export default App;