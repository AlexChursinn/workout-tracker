import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import Spinner from './components/Spinner';
import { getWorkouts, addWorkout, refreshAuthToken, loginWithTelegram, getCustomMuscleGroups, saveCustomMuscleGroups } from './api';
import './global.css';

const defaultMuscleGroups = {
  "Грудь": ["Жим штанги лежа Горизонт", "Жим штанги лежа 45", "Жим штанги лежа Низ", "Жим гантелей 15", "Жим гантелей 30", "Жим гантелей 45", "Брусья", "Разводка гантелей Горизонт", "Разводка гантелей 15", "Сведение рук в кроссовере", "Бабочка", "Отжимания"],
  "Спина": ["Тяга верхнего блока", "Тяга одной рукой в тренажере", "Тяга горизонтального блока", "Тяга одной рукой в наклоне", "Тяга гантели одной рукой в наклоне", "Тяга штанги в наклоне", "Становая тяга", "Подтягивания", "Вис на турнике"],
  "Ноги": ["Присед", "Разгибание ног", "Задняя поверхность бедра (стоя одной ногой в тренажере)", "Задняя поверхность бедра (Двумя ногами)", "Выпады с гантелями", "Жим ногами в тренажере"],
  "Руки": ["Подъем гантелей на скамье 45", "Изогнутый гриф на скамье Скотта", "Скамья Скотта тренажер", "Молотки сидя на скамье", "Молотки стоя", "Подъем прямого грифа стоя", "Подъем изогнутого грифа"],
  "Плечи": ["Жим штанги сидя на скамье", "Жим гантелей сидя на скамье", "Подъем гантелей перед собой сидя на скамье на плечи", "Подъем гантелей в стороны стоя Shorts", "Задняя дельта сидя на скамье", "Тяга к подбородку", "Подъем гантелей на трапецию стоя"],
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
  const hasInitialized = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Текущий маршрут:', location.pathname);
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
    restoreScrollPosition();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('load', restoreScrollPosition);
    };
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      if (hasInitialized.current) {
        console.log('initializeAuth уже вызван, пропускаем');
        return;
      }
      hasInitialized.current = true;

      console.log('Начало initializeAuth, isAuthenticated:', isAuthenticated, 'authToken:', !!authToken);
      setLoading(true);
      try {
        if (window.Telegram?.WebApp?.initDataUnsafe?.user && !isAuthenticated) {
          console.log('Авторизация через Telegram');
          const token = await loginWithTelegram(window.Telegram.WebApp.initDataUnsafe.user);
          localStorage.setItem('jwt', token);
          setAuthToken(token);
          setIsAuthenticated(true);
          await fetchData(token);
        } else if (isAuthenticated && authToken) {
          console.log('Загрузка данных для авторизованного пользователя');
          await fetchData(authToken);
        } else {
          console.log('Нет данных для авторизации, перенаправление на /login');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Ошибка авторизации:', error);
        navigate('/login', { replace: true });
      } finally {
        console.log('Завершение initializeAuth, установка loading: false');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (darkMode) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      if (!authToken || !isAuthenticated) return;
      if (isTokenExpired(authToken)) {
        console.log('Токен истёк, попытка обновления');
        try {
          const newToken = await refreshAuthToken();
          if (newToken) {
            setAuthToken(newToken);
            localStorage.setItem('jwt', newToken);
            await fetchData(newToken);
          } else {
            console.log('Не удалось обновить токен, выход');
            handleLogout();
          }
        } catch (error) {
          console.error('Ошибка при обновлении токена:', error);
          handleLogout();
        }
      }
    };

    const interval = setInterval(checkAndRefreshToken, 15 * 60 * 1000);
    checkAndRefreshToken();
    return () => clearInterval(interval);
  }, [authToken, isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('selectedDate', selectedDate.toISOString());
    localStorage.setItem('showTable', showTable);
  }, [selectedDate, showTable]);

  const fetchData = async (token) => {
    console.log('Начало fetchData');
    try {
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
          bodyWeight: workout.bodyWeight || null,
          notes: workout.notes || '',
        });
        return acc;
      }, {});
      setWorkoutData(formattedData);
      setCustomMuscleGroups(muscleGroupsResponse.muscleGroups || {});
      console.log('fetchData завершён успешно');
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      if (error.message.includes('Unauthorized')) handleLogout();
    }
  };

  const formatDateToLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date, workoutId = 1) => {
    setSelectedDate(date);
    setShowTable(true);
    const formattedDate = formatDateToLocal(date);
    console.log('Переход на дату:', formattedDate, 'workoutId:', workoutId);
    navigate(`/${formattedDate}/${workoutId}`, { replace: true });
  };

  const handleLogin = (token) => {
    console.log('handleLogin вызван, токен:', !!token);
    localStorage.setItem('jwt', token);
    setAuthToken(token);
    setIsAuthenticated(true);
    setSelectedDate(new Date());
    fetchData(token);
  };

  const handleWorkoutChange = async (dataForDate, workoutId, bodyWeight, notes) => {
    try {
      const workoutDate = formatDateToLocal(selectedDate);
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
        bodyWeight: bodyWeight || null,
        notes: notes || '',
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
      const workoutDate = formatDateToLocal(selectedDate);
      const currentWorkouts = workoutData[selectedDate.toDateString()] || [];
      const currentWorkout = currentWorkouts.find((w) => w.workoutId === workoutId) || {};
      const updatedWorkout = {
        workout_date: workoutDate,
        workoutId,
        title: newTitle,
        exercises: currentWorkout.exercises || [],
        bodyWeight: currentWorkout.bodyWeight || null,
        notes: currentWorkout.notes || '',
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
    try {
      setCustomMuscleGroups(newCustomGroups);
      await saveCustomMuscleGroups(newCustomGroups, authToken);
      await fetchData(authToken);
    } catch (error) {
      console.error('Ошибка при сохранении пользовательских групп мышц:', error);
    }
  };

  const toggleTheme = () => setDarkMode((prev) => !prev);

  const handleLogout = () => {
    console.log('Выход из аккаунта');
    localStorage.removeItem('jwt');
    setAuthToken(null);
    setWorkoutData({});
    setCustomMuscleGroups({});
    setIsAuthenticated(false);
    hasInitialized.current = false;
    navigate('/login', { replace: true });
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
      {loading ? (
        <Spinner darkMode={darkMode} />
      ) : (
        <main className="container page-transition" key={location.pathname}>
          <Routes location={location}>
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
                    authToken={authToken}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home
                    workoutData={workoutData}
                    onDateSelect={handleDateSelect}
                    darkMode={darkMode}
                    loading={loading}
                    authToken={authToken}
                    onDataUpdate={() => fetchData(authToken)}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics workoutData={workoutData} darkMode={darkMode} loading={loading} />
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
                  <Settings darkMode={darkMode} toggleTheme={toggleTheme} onLogout={handleLogout} loading={loading} />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
      )}
      {!['/login', '/register'].includes(location.pathname) && !loading && (
        <Footer darkMode={darkMode} onNavigateToday={() => handleDateSelect(new Date())} />
      )}
    </div>
  );
};

export default App;