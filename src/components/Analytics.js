import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useNavigate } from 'react-router-dom';
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
import Spinner from './Spinner';
import styles from './Analytics.module.css';
import lineupWhite from '../assets/lineupwhite-2.svg'; // Импорт белой иконки
import lineupBlack from '../assets/lineupblack-2.svg'; // Импорт черной иконки

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Analytics = ({ workoutData, darkMode, loading }) => {
  const [timeFrame, setTimeFrame] = useState('days');
  const navigate = useNavigate();

  if (loading) {
    return <Spinner darkMode={darkMode} />;
  }

  const workoutStats = Object.entries(workoutData).flatMap(([date, workouts]) =>
    workouts.map((workout) => ({
      date,
      title: workout.title || `Тренировка ${workout.workoutId}`,
      totalReps: workout.exercises.reduce((sum, ex) => sum + (ex.reps || 0), 0),
      totalWeight: workout.exercises.reduce((sum, ex) => sum + (ex.weight || 0) * (ex.reps || 0), 0),
      exerciseCount: workout.exercises.length,
    }))
  );

  const hasWorkouts = workoutStats.length > 0;

  const exerciseStats = Object.entries(workoutData).reduce((acc, [date, workouts]) => {
    workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        const name = exercise.name;
        if (!acc[name]) {
          acc[name] = { maxWeight: 0, maxReps: 0, history: [] };
        }
        acc[name].maxWeight = Math.max(acc[name].maxWeight, exercise.weight || 0);
        acc[name].maxReps = Math.max(acc[name].maxReps, exercise.reps || 0);
        acc[name].history.push({ date, weight: exercise.weight || 0, reps: exercise.reps || 0 });
      });
    });
    return acc;
  }, {});

  const groupByTimeFrame = (history) => {
    const grouped = {};
    history.forEach((entry) => {
      const date = new Date(entry.date);
      let key;
      if (timeFrame === 'days') key = date.toISOString().split('T')[0];
      else if (timeFrame === 'weeks') key = `${date.getFullYear()}-W${Math.ceil((date.getDate() + (date.getDay() || 7)) / 7)}`;
      else key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!grouped[key]) grouped[key] = { totalWeight: 0, count: 0 };
      grouped[key].totalWeight += entry.weight * entry.reps;
      grouped[key].count += 1;
    });
    return Object.entries(grouped)
      .map(([key, value]) => ({
        date: key,
        avgWeight: value.totalWeight / value.count,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getChartData = (exercise) => {
    const history = groupByTimeFrame(exerciseStats[exercise].history);
    return {
      labels: history.map((h) => h.date),
      datasets: [
        {
          label: 'Средний вес',
          data: history.map((h) => h.avgWeight),
          borderColor: darkMode ? '#e0e0e0' : '#000',
          backgroundColor: darkMode ? 'rgba(224, 224, 224, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          fill: true,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, labels: { color: darkMode ? '#e0e0e0' : '#000' } },
      title: { display: false },
    },
    scales: {
      x: { ticks: { color: darkMode ? '#e0e0e0' : '#000' } },
      y: { ticks: { color: darkMode ? '#e0e0e0' : '#000' } },
    },
  };

  const handleNavigateToHome = () => {
    navigate('/home');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Статистика тренировок</h1>
      {hasWorkouts ? (
        <>
          <section className={styles.section}>
            <h2 className={styles.subtitle}>Тренировки</h2>
            <TransitionGroup className={styles.statsGrid}>
              {workoutStats.map((stats, index) => (
                <CSSTransition key={index} timeout={500} classNames="block">
                  <div className={styles.statsCard}>
                    <h3>
                      {stats.date} - {stats.title}
                    </h3>
                    <p>Повторений: {stats.totalReps}</p>
                    <p>Общий вес: {stats.totalWeight} кг</p>
                    <p>Упражнений: {stats.exerciseCount}</p>
                  </div>
                </CSSTransition>
              ))}
            </TransitionGroup>
          </section>

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
            <TransitionGroup className={styles.statsGrid}>
              {Object.entries(exerciseStats).map(([exercise, stats]) => (
                <CSSTransition key={exercise} timeout={500} classNames="block">
                  <div className={styles.statsCard}>
                    <h3>{exercise}</h3>
                    <p>Макс. вес: {stats.maxWeight} кг</p>
                    <p>Макс. повторений: {stats.maxReps}</p>
                    <div className={styles.chartContainer}>
                      <Line data={getChartData(exercise)} options={chartOptions} />
                    </div>
                  </div>
                </CSSTransition>
              ))}
            </TransitionGroup>
          </section>
        </>
      ) : (
        <div className={styles.noWorkouts}>
          <h1 className={styles.noWorkoutsMessage}>
            Чтобы появилась аналитика, создайте свою первую тренировку
          </h1>
          <img
            src={darkMode ? lineupWhite : lineupBlack}
            alt="Линия"
            className={styles.lineIcon}
          />
          <button className={styles.createButton} onClick={handleNavigateToHome}>
            Создать тренировку
          </button>
        </div>
      )}
    </div>
  );
};

export default Analytics;