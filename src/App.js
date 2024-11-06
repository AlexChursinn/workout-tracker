// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import DateSelector from './components/DateSelector';
import WorkoutTable from './components/WorkoutTable';
import Footer from './components/Footer';
import Analytics from './components/Analytics';
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

  const toggleTheme = () => {
    setDarkMode((prevMode) => !prevMode);
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
    const fetchData = async () => {
      try {
        const workouts = await getWorkouts();
        const formattedData = workouts.reduce((acc, workout) => {
          acc[new Date(workout.workout_date).toDateString()] = workout.exercises || [];
          return acc;
        }, {});
        setWorkoutData(formattedData);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedDate', selectedDate.toISOString());
    localStorage.setItem('showTable', showTable);
  }, [selectedDate, showTable]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowTable(true);
  };

  const handleWorkoutChange = async (dataForDate) => {
    try {
      const workoutDate = selectedDate.toISOString().split('T')[0];
      const newWorkout = {
        workout_date: workoutDate,
        exercises: dataForDate,
      };
      await addWorkout(newWorkout); // Убрали переменную response
      setWorkoutData((prevData) => ({
        ...prevData,
        [selectedDate.toDateString()]: dataForDate,
      }));
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
    }
  };

  const filledDates = Object.keys(workoutData).filter(
    (date) => workoutData[date] && workoutData[date].length > 0
  );

  return (
    <div className="container">
      <Header darkMode={darkMode} toggleTheme={toggleTheme} />
      <Routes>
        <Route
          path="/"
          element={
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
          }
        />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
      <Footer darkMode={darkMode} onNavigateToday={() => handleDateSelect(new Date())} />
    </div>
  );
};

export default App;
