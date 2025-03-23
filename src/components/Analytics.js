// src/pages/Analytics.js
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from './Analytics.module.css';

// Регистрация компонентов Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Analytics = ({ workoutData, darkMode }) => {
  const [timeFrame, setTimeFrame] = useState('days'); // days, weeks, months

  // Фильтрация тренировок с непустыми упражнениями и валидными данными
  const validWorkouts = Object.entries(workoutData)
    .filter(([_, workout]) => workout.exercises && workout.exercises.length > 0)
    .map(([date, workout]) => ({
      date: new Date(date),
      title: workout.title || 'Без названия',
      exercises: workout.exercises.filter(
        (ex) => ex.sets && ex.sets.some((set) => set.reps && set.weight && !set.isEditing)
      ),
    }))
    .filter((workout) => workout.exercises.length > 0);

  // Статистика по тренировкам
  const workoutStats = validWorkouts.map((workout) => {
    const totalReps = workout.exercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s, set) => s + (parseInt(set.reps) || 0), 0),
      0
    );
    const totalWeight = workout.exercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s, set) => s + (parseInt(set.weight) || 0) * (parseInt(set.reps) || 0), 0),
      0
    );
    const exerciseCount = workout.exercises.length;

    return {
      date: workout.date.toLocaleDateString('ru-RU'),
      title: workout.title,
      totalReps,
      totalWeight,
      exerciseCount,
    };
  });

  // Статистика по упражнениям
  const exerciseStats = {};
  validWorkouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      if (!exercise.exercise) return; // Пропускаем пустые упражнения
      if (!exerciseStats[exercise.exercise]) {
        exerciseStats[exercise.exercise] = {
          maxWeight: 0,
          maxReps: 0,
          history: [],
        };
      }
      const sets = exercise.sets.filter((set) => set.reps && set.weight && !set.isEditing);
      sets.forEach((set) => {
        const weight = parseInt(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;
        exerciseStats[exercise.exercise].maxWeight = Math.max(
          exerciseStats[exercise.exercise].maxWeight,
          weight
        );
        exerciseStats[exercise.exercise].maxReps = Math.max(
          exerciseStats[exercise.exercise].maxReps,
          reps
        );
        exerciseStats[exercise.exercise].history.push({
          date: workout.date,
          weight,
          reps,
        });
      });
    });
  });

  // Подготовка данных для графика
  const getChartData = (exerciseName) => {
    const history = exerciseStats[exerciseName].history.sort((a, b) => a.date - b.date);

    const groupByTimeFrame = (date) => {
      if (timeFrame === 'days') return date.toLocaleDateString('ru-RU');
      if (timeFrame === 'weeks') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `Неделя с ${weekStart.toLocaleDateString('ru-RU')}`;
      }
      if (timeFrame === 'months') return date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
    };

    const groupedData = history.reduce((acc, { date, weight }) => {
      const key = groupByTimeFrame(date);
      if (!acc[key]) acc[key] = [];
      acc[key].push(weight);
      return acc;
    }, {});

    const labels = Object.keys(groupedData);
    const data = Object.values(groupedData).map((weights) => Math.max(...weights));

    return {
      labels,
      datasets: [
        {
          label: `Вес (${exerciseName})`,
          data,
          borderColor: darkMode ? '#ffffff' : '#333333',
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(51, 51, 51, 0.2)',
          fill: true,
          tension: 0.1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: darkMode ? '#ffffff' : '#333333' } },
      title: { display: true, text: 'Динамика веса', color: darkMode ? '#ffffff' : '#333333' },
    },
    scales: {
      x: { ticks: { color: darkMode ? '#ffffff' : '#333333' } },
      y: { ticks: { color: darkMode ? '#ffffff' : '#333333' }, beginAtZero: true },
    },
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Статистика тренировок</h1>

      {/* Статистика по тренировкам */}
      <section className={styles.section}>
        <h2 className={styles.subtitle}>Тренировки</h2>
        {workoutStats.length > 0 ? (
          <div className={styles.statsGrid}>
            {workoutStats.map((stats, index) => (
              <div key={index} className={styles.statsCard}>
                <h3>{stats.date} - {stats.title}</h3>
                <p>Повторений: {stats.totalReps}</p>
                <p>Общий вес: {stats.totalWeight} кг</p>
                <p>Упражнений: {stats.exerciseCount}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>Нет данных о тренировках</p>
        )}
      </section>

      {/* Статистика по упражнениям */}
      <section className={styles.section}>
        <h2 className={styles.subtitle}>Упражнения</h2>
        <div className={styles.timeFrameSelector}>
          <button
            className={timeFrame === 'days' ? styles.activeButton : styles.button}
            onClick={() => setTimeFrame('days')}
          >
            Дни
          </button>
          <button
            className={timeFrame === 'weeks' ? styles.activeButton : styles.button}
            onClick={() => setTimeFrame('weeks')}
          >
            Недели
          </button>
          <button
            className={timeFrame === 'months' ? styles.activeButton : styles.button}
            onClick={() => setTimeFrame('months')}
          >
            Месяцы
          </button>
        </div>
        {Object.keys(exerciseStats).length > 0 ? (
          <div className={styles.statsGrid}>
            {Object.entries(exerciseStats).map(([exercise, stats]) => (
              <div key={exercise} className={styles.statsCard}>
                <h3>{exercise}</h3>
                <p>Макс. вес: {stats.maxWeight} кг</p>
                <p>Макс. повторений: {stats.maxReps}</p>
                <div className={styles.chartContainer}>
                  <Line data={getChartData(exercise)} options={chartOptions} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>Нет данных об упражнениях</p>
        )}
      </section>
    </div>
  );
};

export default Analytics;