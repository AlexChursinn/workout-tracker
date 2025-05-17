import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from 'chart.js';
import Spinner from './Spinner';
import styles from './Analytics.module.css';
import workoutIconBlack from '../assets/done-black.svg';
import workoutIconWhite from '../assets/done-light.svg';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);
registerLocale('ru', ru);

const Analytics = ({ workoutData, darkMode, loading }) => {
  const [timeFrame, setTimeFrame] = useState('month');
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date());
  const [exerciseTimeFrame, setExerciseTimeFrame] = useState('month');
  const [exerciseSelectedMonth, setExerciseSelectedMonth] = useState(new Date());
  const [exerciseSelectedYear, setExerciseSelectedYear] = useState(new Date());
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [tappedDataByChart, setTappedDataByChart] = useState({
    workout: null,
    bodyWeight: null,
    exercise: null,
  });
  const navigate = useNavigate();

  const totalWorkouts = useMemo(() => {
    return Object.values(workoutData).reduce((sum, workouts) => sum + workouts.length, 0);
  }, [workoutData]);

  const hasBodyWeightData = useMemo(() => {
    return Object.values(workoutData).some(workouts =>
      workouts.some(workout => workout.bodyWeight !== null && workout.bodyWeight !== '')
    );
  }, [workoutData]);

  const getDateRange = useMemo(() => {
    if (timeFrame === 'week') {
      const start = new Date(selectedWeek);
      start.setDate(start.getDate() - start.getDay() + 1);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { start, end };
    } else if (timeFrame === 'month') {
      const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      return { start, end };
    } else if (timeFrame === 'year') {
      const start = new Date(selectedYear.getFullYear(), 0, 1);
      const end = new Date(selectedYear.getFullYear(), 11, 31);
      return { start, end };
    }
    return { start: new Date(), end: new Date() };
  }, [timeFrame, selectedWeek, selectedMonth, selectedYear]);

  const getExerciseDateRange = useMemo(() => {
    if (exerciseTimeFrame === 'month') {
      const start = new Date(exerciseSelectedMonth.getFullYear(), exerciseSelectedMonth.getMonth(), 1);
      const end = new Date(exerciseSelectedMonth.getFullYear(), exerciseSelectedMonth.getMonth() + 1, 0);
      return { start, end };
    } else if (exerciseTimeFrame === 'year') {
      const start = new Date(exerciseSelectedYear.getFullYear(), 0, 1);
      const end = new Date(exerciseSelectedYear.getFullYear(), 11, 31);
      return { start, end };
    }
    return { start: new Date(), end: new Date() };
  }, [exerciseTimeFrame, exerciseSelectedMonth, exerciseSelectedYear]);

  const getWorkoutCountData = useCallback(() => {
    const { start, end } = getDateRange;
    const labels = [];
    const data = [];
    const pointRadii = [];

    if (timeFrame === 'week') {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toDateString();
        labels.push(d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }));
        const workoutCount = (workoutData[dateKey] || []).length;
        data.push(workoutCount);
        pointRadii.push(workoutCount > 0 ? 5 : 0);
      }
    } else if (timeFrame === 'month') {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toDateString();
        labels.push(d.toLocaleDateString('ru-RU', { day: 'numeric' }));
        const workoutCount = (workoutData[dateKey] || []).length;
        data.push(workoutCount);
        pointRadii.push(workoutCount > 0 ? 5 : 0);
      }
    } else if (timeFrame === 'year') {
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(start.getFullYear(), month, 1);
        const monthEnd = new Date(start.getFullYear(), month + 1, 0);
        labels.push(monthStart.toLocaleDateString('ru-RU', { month: 'short' }));
        const workoutsInMonth = Object.keys(workoutData)
          .filter((date) => {
            const workoutDate = new Date(date);
            return workoutDate >= monthStart && workoutDate <= monthEnd;
          })
          .reduce((sum, date) => sum + workoutData[date].length, 0);
        data.push(workoutsInMonth);
        pointRadii.push(workoutsInMonth > 0 ? 5 : 0);
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Тренировки',
          data,
          borderColor: darkMode ? '#6b7280' : '#1f2937',
          backgroundColor: darkMode ? 'rgba(107, 114, 128, 0.1)' : 'rgba(31, 41, 55, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: pointRadii,
          pointHoverRadius: pointRadii.map(r => r > 0 ? 8 : 0),
        },
      ],
    };
  }, [workoutData, timeFrame, getDateRange, darkMode]);

  const getBodyWeightData = useCallback(() => {
    const { start, end } = getExerciseDateRange;
    const history = [];

    Object.entries(workoutData).forEach(([date, workouts]) => {
      workouts.forEach((workout) => {
        if (workout.bodyWeight !== null && workout.bodyWeight !== '') {
          history.push({
            date: new Date(date),
            weight: parseFloat(workout.bodyWeight) || 0,
          });
        }
      });
    });

    const filteredHistory = history.filter((entry) => entry.date >= start && entry.date <= end);
    if (filteredHistory.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Вес тела (кг)',
          data: [],
          borderColor: darkMode ? '#9ca3af' : '#4b5563',
          backgroundColor: darkMode ? 'rgba(156, 163, 175, 0.1)' : 'rgba(75, 85, 99, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: [],
          pointHoverRadius: [],
        }],
      };
    }

    const aggregatedData = {};
    if (exerciseTimeFrame === 'month') {
      filteredHistory.forEach((entry) => {
        const dateKey = entry.date.toDateString();
        if (!aggregatedData[dateKey] || entry.date > aggregatedData[dateKey].date) {
          aggregatedData[dateKey] = { weight: entry.weight, date: entry.date };
        }
      });
    } else if (exerciseTimeFrame === 'year') {
      filteredHistory.forEach((entry) => {
        const monthKey = `${entry.date.getFullYear()}-${entry.date.getMonth()}`;
        if (!aggregatedData[monthKey] || entry.date > aggregatedData[monthKey].date) {
          aggregatedData[monthKey] = { weight: entry.weight, date: entry.date };
        }
      });
    }

    const labels = [];
    const weightData = [];
    const pointRadii = [];

    if (exerciseTimeFrame === 'month') {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toDateString();
        labels.push(d.toLocaleDateString('ru-RU', { day: 'numeric' }));
        const entry = aggregatedData[dateKey] || { weight: 0 };
        weightData.push(entry.weight);
        pointRadii.push(entry.weight > 0 ? 5 : 0);
      }
    } else if (exerciseTimeFrame === 'year') {
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(start.getFullYear(), month, 1);
        const monthKey = `${monthStart.getFullYear()}-${monthStart.getMonth()}`;
        labels.push(monthStart.toLocaleDateString('ru-RU', { month: 'short' }));
        const entry = aggregatedData[monthKey] || { weight: 0 };
        weightData.push(entry.weight);
        pointRadii.push(entry.weight > 0 ? 5 : 0);
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Вес тела (кг)',
          data: weightData,
          borderColor: darkMode ? '#9ca3af' : '#4b5563',
          backgroundColor: darkMode ? 'rgba(156, 163, 175, 0.1)' : 'rgba(75, 85, 99, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: pointRadii,
          pointHoverRadius: pointRadii.map(r => r > 0 ? 8 : 0),
        },
      ],
    };
  }, [workoutData, exerciseTimeFrame, getExerciseDateRange, darkMode]);

  const availableExercises = useMemo(() => {
    const exercises = new Set();
    Object.values(workoutData).forEach((workouts) =>
      workouts.forEach((workout) => {
        if (workout.exercises) {
          workout.exercises.forEach((exercise) => {
            const exerciseName = exercise.exercise || exercise.name;
            if (exerciseName) exercises.add(exerciseName);
          });
        }
      })
    );
    return Array.from(exercises).sort();
  }, [workoutData]);

  const getExerciseStats = useCallback(() => {
    if (!exerciseSearch) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const history = [];
    Object.entries(workoutData).forEach(([date, workouts]) => {
      workouts.forEach((workout) => {
        if (workout.exercises) {
          workout.exercises.forEach((exercise) => {
            const exerciseName = exercise.exercise || exercise.name;
            if (exerciseName === exerciseSearch && exercise.sets) {
              exercise.sets.forEach((set) => {
                history.push({
                  date: new Date(date),
                  reps: parseInt(set.reps) || 0,
                  weight: parseFloat(set.weight) || 0,
                  weightType: set.weightType || 'Вес',
                });
              });
            }
          });
        }
      });
    });

    const { start, end } = getExerciseDateRange;
    const filteredHistory = history.filter((entry) => entry.date >= start && entry.date <= end);

    if (filteredHistory.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const aggregatedData = {};
    const weightTypes = ['Вес', 'Доп. вес', 'Соб. вес', 'Гриф', 'Резинки'];

    if (exerciseTimeFrame === 'month') {
      weightTypes.forEach((type) => {
        filteredHistory
          .filter((entry) => entry.weightType === type)
          .forEach((entry) => {
            const dateKey = entry.date.toDateString();
            if (!aggregatedData[dateKey]) {
              aggregatedData[dateKey] = {};
            }
            if (!aggregatedData[dateKey][type]) {
              aggregatedData[dateKey][type] = { maxWeight: -Infinity, repsAtMaxWeight: 0 };
            }
            if (entry.weight > aggregatedData[dateKey][type].maxWeight) {
              aggregatedData[dateKey][type] = { maxWeight: entry.weight, repsAtMaxWeight: entry.reps };
            }
          });
      });
    } else if (exerciseTimeFrame === 'year') {
      weightTypes.forEach((type) => {
        filteredHistory
          .filter((entry) => entry.weightType === type)
          .forEach((entry) => {
            const monthKey = `${entry.date.getFullYear()}-${entry.date.getMonth()}`;
            if (!aggregatedData[monthKey]) {
              aggregatedData[monthKey] = {};
            }
            if (!aggregatedData[monthKey][type]) {
              aggregatedData[monthKey][type] = { maxWeight: -Infinity, repsAtMaxWeight: 0 };
            }
            if (entry.weight > aggregatedData[monthKey][type].maxWeight) {
              aggregatedData[monthKey][type] = { maxWeight: entry.weight, repsAtMaxWeight: entry.reps };
            }
          });
      });
    }

    const labels = [];
    const datasets = [];

    if (exerciseTimeFrame === 'month') {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toDateString();
        labels.push(d.toLocaleDateString('ru-RU', { day: 'numeric' }));
        weightTypes.forEach((type, index) => {
          const entry = aggregatedData[dateKey]?.[type] || { maxWeight: 0, repsAtMaxWeight: 0 };
          if (!datasets[index * 2]) {
            datasets[index * 2] = {
              label: `Повторения (${type})`,
              data: [],
              pointRadius: [],
              pointHoverRadius: [],
              borderColor: darkMode ? `#${(6 + index * 2).toString(16)}b7280` : `#${(1 + index * 2).toString(16)}f2937`,
              backgroundColor: darkMode ? `rgba(${107 + index * 20}, 114, 128, 0.1)` : `rgba(${31 + index * 20}, 41, 55, 0.1)`,
              fill: true,
              tension: 0.4,
              yAxisID: 'y',
            };
            datasets[index * 2 + 1] = {
              label: `${type} (кг)`,
              data: [],
              pointRadius: [],
              pointHoverRadius: [],
              borderColor: darkMode ? `#${(9 + index * 2).toString(16)}ca3af` : `#${(4 + index * 2).toString(16)}b5563`,
              backgroundColor: darkMode ? `rgba(${156 + index * 20}, 163, 175, 0.1)` : `rgba(${75 + index * 20}, 85, 99, 0.1)`,
              fill: true,
              tension: 0.4,
              yAxisID: 'y1',
            };
          }
          datasets[index * 2].data.push(entry.repsAtMaxWeight);
          datasets[index * 2].pointRadius.push(entry.repsAtMaxWeight > 0 ? 5 : 0);
          datasets[index * 2].pointHoverRadius.push(entry.repsAtMaxWeight > 0 ? 8 : 0);
          datasets[index * 2 + 1].data.push(entry.maxWeight);
          datasets[index * 2 + 1].pointRadius.push(entry.maxWeight > 0 ? 5 : 0);
          datasets[index * 2 + 1].pointHoverRadius.push(entry.maxWeight > 0 ? 8 : 0);
        });
      }
    } else if (exerciseTimeFrame === 'year') {
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(start.getFullYear(), month, 1);
        const monthKey = `${monthStart.getFullYear()}-${monthStart.getMonth()}`;
        labels.push(monthStart.toLocaleDateString('ru-RU', { month: 'short' }));
        weightTypes.forEach((type, index) => {
          const entry = aggregatedData[monthKey]?.[type] || { maxWeight: 0, repsAtMaxWeight: 0 };
          if (!datasets[index * 2]) {
            datasets[index * 2] = {
              label: `Повторения (${type})`,
              data: [],
              pointRadius: [],
              pointHoverRadius: [],
              borderColor: darkMode ? `#${(6 + index * 2).toString(16)}b7280` : `#${(1 + index * 2).toString(16)}f2937`,
              backgroundColor: darkMode ? `rgba(${107 + index * 20}, 114, 128, 0.1)` : `rgba(${31 + index * 20}, 41, 55, 0.1)`,
              fill: true,
              tension: 0.4,
              yAxisID: 'y',
            };
            datasets[index * 2 + 1] = {
              label: `${type} (кг)`,
              data: [],
              pointRadius: [],
              pointHoverRadius: [],
              borderColor: darkMode ? `#${(9 + index * 2).toString(16)}ca3af` : `#${(4 + index * 2).toString(16)}b5563`,
              backgroundColor: darkMode ? `rgba(${156 + index * 20}, 163, 175, 0.1)` : `rgba(${75 + index * 20}, 85, 99, 0.1)`,
              fill: true,
              tension: 0.4,
              yAxisID: 'y1',
            };
          }
          datasets[index * 2].data.push(entry.repsAtMaxWeight);
          datasets[index * 2].pointRadius.push(entry.repsAtMaxWeight > 0 ? 5 : 0);
          datasets[index * 2].pointHoverRadius.push(entry.repsAtMaxWeight > 0 ? 8 : 0);
          datasets[index * 2 + 1].data.push(entry.maxWeight);
          datasets[index * 2 + 1].pointRadius.push(entry.maxWeight > 0 ? 5 : 0);
          datasets[index * 2 + 1].pointHoverRadius.push(entry.maxWeight > 0 ? 8 : 0);
        });
      }
    }

    return { labels, datasets };
  }, [exerciseSearch, workoutData, exerciseTimeFrame, getExerciseDateRange, darkMode]);

  const handleChartClick = useCallback((event, elements, chart, chartType) => {
    if (elements.length > 0) {
      const { datasetIndex, index } = elements[0];
      const dataset = chart.data.datasets[datasetIndex];
      const value = dataset.data[index];
      if (value === 0) return;
      const label = chart.data.labels[index];
      setTappedDataByChart({
        workout: null,
        bodyWeight: null,
        exercise: null,
        [chartType]: {
          label: dataset.label,
          value,
          date: label,
          unit: dataset.label.includes('(кг)') ? 'кг' : '',
        },
      });
    } else {
      setTappedDataByChart({
        workout: null,
        bodyWeight: null,
        exercise: null,
      });
    }
  }, []);

  const handleCloseTappedData = useCallback((chartType) => {
    setTappedDataByChart((prev) => ({
      ...prev,
      [chartType]: null,
    }));
  }, []);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true, 
          position: 'top',
          labels: {
            color: darkMode ? '#e5e7eb' : '#1f2937',
            font: { size: 12 },
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: darkMode ? '#1f2937' : '#fff',
          titleColor: darkMode ? '#e5e7eb' : '#1f2937',
          bodyColor: darkMode ? '#e5e7eb' : '#1f2937',
          borderColor: darkMode ? '#4b5563' : '#d1d5db',
          borderWidth: 1,
          mode: 'nearest',
          intersect: true,
          filter: (tooltipItem) => {
            const dataPoints = tooltipItem.chart.tooltip.dataPoints;
            return tooltipItem.parsed.y !== 0 && dataPoints && dataPoints.length > 0 && tooltipItem.datasetIndex === dataPoints[0].datasetIndex;
          },
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y || 0;
              return `${label}: ${value}${label.includes('(кг)') ? ' кг' : ''}`;
            },
            title: (tooltipItems) => {
              return tooltipItems.length > 0 ? tooltipItems[0].label : '';
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: exerciseTimeFrame === 'year' ? 'Месяц' : 'Дата',
            color: darkMode ? '#e5e7eb' : '#1f2937',
            font: { size: 12, weight: '500' },
          },
          ticks: { 
            color: darkMode ? '#e5e7eb' : '#1f2937', 
            maxTicksLimit: 8,
            font: { size: 11 },
          },
          grid: { 
            display: false,
            borderColor: darkMode ? '#4b5563' : '#d1d5db',
          },
        },
        y: {
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: 'Повторения',
            color: darkMode ? '#e5e7eb' : '#1f2937',
            font: { size: 12, weight: '500' },
          },
          ticks: {
            color: darkMode ? '#e5e7eb' : '#1f2937',
            maxTicksLimit: 6,
            stepSize: 1,
            precision: 0,
            font: { size: 11 },
          },
          grid: { 
            color: darkMode ? '#4b5563' : '#e5e7eb',
            borderColor: darkMode ? '#4b5563' : '#d1d5db',
          },
        },
        y1: {
          type: 'linear',
          position: 'right',
          title: {
            display: true,
            text: 'Вес (кг)',
            color: darkMode ? '#e5e7eb' : '#1f2937',
            font: { size: 12, weight: '500' },
          },
          ticks: { 
            color: darkMode ? '#e5e7eb' : '#1f2937', 
            maxTicksLimit: 6,
            font: { size: 11 },
          },
          grid: { 
            display: false,
            borderColor: darkMode ? '#4b5563' : '#d1d5db',
          },
        },
      },
      interaction: {
        mode: 'nearest',
        intersect: true,
        axis: 'x',
      },
      onClick: (event, elements, chart) => handleChartClick(event, elements, chart, 'exercise'),
    }),
    [darkMode, exerciseTimeFrame, handleChartClick]
  );

  const workoutChartOptions = useMemo(
    () => ({
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        x: {
          title: {
            display: true,
            text: timeFrame === 'year' ? 'Месяц' : 'Дата',
            color: darkMode ? '#e5e7eb' : '#1f2937',
            font: { size: 12, weight: '500' },
          },
          ticks: { 
            color: darkMode ? '#e5e7eb' : '#1f2937', 
            maxTicksLimit: 8,
            font: { size: 11 },
          },
          grid: { 
            display: false,
            borderColor: darkMode ? '#4b5563' : '#d1d5db',
          },
        },
        y: {
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: 'Количество тренировок',
            color: darkMode ? '#e5e7eb' : '#1f2937',
            font: { size: 12, weight: '500' },
          },
          ticks: {
            color: darkMode ? '#e5e7eb' : '#1f2937',
            maxTicksLimit: 6,
            stepSize: 1,
            precision: 0,
            font: { size: 11 },
          },
          grid: { 
            color: darkMode ? '#4b5563' : '#e5e7eb',
            borderColor: darkMode ? '#4b5563' : '#d1d5db',
          },
        },
        y1: { display: false },
      },
      onClick: (event, elements, chart) => handleChartClick(event, elements, chart, 'workout'),
    }),
    [chartOptions, darkMode, timeFrame, handleChartClick]
  );

  const bodyWeightChartOptions = useMemo(
    () => ({
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        x: {
          title: {
            display: true,
            text: exerciseTimeFrame === 'year' ? 'Месяц' : 'Дата',
            color: darkMode ? '#e5e7eb' : '#1f2937',
            font: { size: 12, weight: '500' },
          },
          ticks: { 
            color: darkMode ? '#e5e7eb' : '#1f2937', 
            maxTicksLimit: 8,
            font: { size: 11 },
          },
          grid: { 
            display: false,
            borderColor: darkMode ? '#4b5563' : '#d1d5db',
          },
        },
        y: {
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: 'Вес тела (кг)',
            color: darkMode ? '#e5e7eb' : '#1f2937',
            font: { size: 12, weight: '500' },
          },
          ticks: { 
            color: darkMode ? '#e5e7eb' : '#1f2937', 
            maxTicksLimit: 6,
            font: { size: 11 },
          },
          grid: { 
            color: darkMode ? '#4b5563' : '#e5e7eb',
            borderColor: darkMode ? '#4b5563' : '#d1d5db',
          },
        },
        y1: { display: false },
      },
      onClick: (event, elements, chart) => handleChartClick(event, elements, chart, 'bodyWeight'),
    }),
    [chartOptions, darkMode, exerciseTimeFrame, handleChartClick]
  );

  const hasWorkouts = totalWorkouts > 0;

  const handleReturnHome = useCallback(() => {
    navigate('/home');
  }, [navigate]);

  if (loading) {
    return <Spinner darkMode={darkMode} />;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Аналитика тренировок</h1>
      {hasWorkouts ? (
        <>
          <section className={styles.totalWorkouts}>
            <img
              src={darkMode ? workoutIconWhite : workoutIconBlack}
              alt="Иконка тренировок"
              className={styles.workoutIcon}
            />
            <h2 className={styles.totalWorkoutsText}>Всего тренировок</h2>
            <span className={styles.totalWorkoutsCount}>{totalWorkouts}</span>
          </section>

          <section className={styles.section}>
            <h2 className={styles.subtitle}>Количество тренировок</h2>
            <div className={styles.controls}>
              <div className={styles.timeFrameSelector}>
                <button
                  className={timeFrame === 'week' ? styles.activeButton : styles.button}
                  onClick={() => setTimeFrame('week')}
                >
                  Неделя
                </button>
                <button
                  className={timeFrame === 'month' ? styles.activeButton : styles.button}
                  onClick={() => setTimeFrame('month')}
                >
                  Месяц
                </button>
                <button
                  className={timeFrame === 'year' ? styles.activeButton : styles.button}
                  onClick={() => setTimeFrame('year')}
                >
                  Год
                </button>
              </div>
              {timeFrame === 'week' && (
                <DatePicker
                  selected={selectedWeek}
                  onChange={(date) => setSelectedWeek(date)}
                  dateFormat="d MMMM yyyy"
                  locale="ru"
                  showWeekNumbers
                  showWeekPicker
                  className={styles.datePicker}
                  placeholderText="Выберите неделю"
                />
              )}
              {timeFrame === 'month' && (
                <DatePicker
                  selected={selectedMonth}
                  onChange={(date) => setSelectedMonth(date)}
                  dateFormat="MMMM yyyy"
                  locale="ru"
                  showMonthYearPicker
                  className={styles.datePicker}
                  placeholderText="Выберите месяц"
                />
              )}
              {timeFrame === 'year' && (
                <DatePicker
                  selected={selectedYear}
                  onChange={(date) => setSelectedYear(date)}
                  dateFormat="yyyy"
                  locale="ru"
                  showYearPicker
                  className={styles.datePicker}
                  placeholderText="Выберите год"
                />
              )}
            </div>
            <div className={`${styles.chartContainer} ${tappedDataByChart.workout ? styles.activeChart : ''}`}>
              <Line data={getWorkoutCountData()} options={workoutChartOptions} />
              <TransitionGroup>
                {tappedDataByChart.workout && (
                  <CSSTransition timeout={300} classNames="notification">
                    <div className={styles.tappedData}>
                      <span>
                        {tappedDataByChart.workout.label}: {tappedDataByChart.workout.value} {tappedDataByChart.workout.unit} ({tappedDataByChart.workout.date})
                      </span>
                      <button
                        className={styles.closeButton}
                        onClick={() => handleCloseTappedData('workout')}
                      >
                        ×
                      </button>
                    </div>
                  </CSSTransition>
                )}
              </TransitionGroup>
            </div>
          </section>

          {hasBodyWeightData && (
            <section className={styles.section}>
              <h2 className={styles.subtitle}>Прогресс веса тела</h2>
              <div className={styles.controls}>
                <div className={styles.timeFrameSelector}>
                  <button
                    className={exerciseTimeFrame === 'month' ? styles.activeButton : styles.button}
                    onClick={() => setExerciseTimeFrame('month')}
                  >
                    Месяц
                  </button>
                  <button
                    className={exerciseTimeFrame === 'year' ? styles.activeButton : styles.button}
                    onClick={() => setExerciseTimeFrame('year')}
                  >
                    Год
                  </button>
                </div>
                {exerciseTimeFrame === 'month' && (
                  <DatePicker
                    selected={exerciseSelectedMonth}
                    onChange={(date) => setExerciseSelectedMonth(date)}
                    dateFormat="MMMM yyyy"
                    locale="ru"
                    showMonthYearPicker
                    className={styles.datePicker}
                    placeholderText="Выберите месяц"
                  />
                )}
                {exerciseTimeFrame === 'year' && (
                  <DatePicker
                    selected={exerciseSelectedYear}
                    onChange={(date) => setExerciseSelectedYear(date)}
                    dateFormat="yyyy"
                    locale="ru"
                    showYearPicker
                    className={styles.datePicker}
                    placeholderText="Выберите год"
                  />
                )}
              </div>
              <div className={`${styles.chartContainer} ${tappedDataByChart.bodyWeight ? styles.activeChart : ''}`}>
                {getBodyWeightData().labels.length > 0 ? (
                  <Line data={getBodyWeightData()} options={bodyWeightChartOptions} />
                ) : (
                  <p className={styles.noDataMessage}>Нет данных о весе для выбранного периода</p>
                )}
                <TransitionGroup>
                  {tappedDataByChart.bodyWeight && (
                    <CSSTransition timeout={300} classNames="notification">
                      <div className={styles.tappedData}>
                        <span>
                          {tappedDataByChart.bodyWeight.label}: {tappedDataByChart.bodyWeight.value} {tappedDataByChart.bodyWeight.unit} ({tappedDataByChart.bodyWeight.date})
                        </span>
                        <button
                          className={styles.closeButton}
                          onClick={() => handleCloseTappedData('bodyWeight')}
                        >
                          ×
                        </button>
                      </div>
                    </CSSTransition>
                  )}
                </TransitionGroup>
              </div>
            </section>
          )}

          <section className={styles.section}>
            <h2 className={styles.subtitle}>Статистика по упражнениям</h2>
            <div className={styles.controls}>
              <div className={styles.timeFrameSelector}>
                <button
                  className={exerciseTimeFrame === 'month' ? styles.activeButton : styles.button}
                  onClick={() => setExerciseTimeFrame('month')}
                >
                  Месяц
                </button>
                <button
                  className={exerciseTimeFrame === 'year' ? styles.activeButton : styles.button}
                  onClick={() => setExerciseTimeFrame('year')}
                >
                  Год
                </button>
              </div>
              {exerciseTimeFrame === 'month' && (
                <DatePicker
                  selected={exerciseSelectedMonth}
                  onChange={(date) => setExerciseSelectedMonth(date)}
                  dateFormat="MMMM yyyy"
                  locale="ru"
                  showMonthYearPicker
                  className={styles.datePicker}
                  placeholderText="Выберите месяц"
                />
              )}
              {exerciseTimeFrame === 'year' && (
                <DatePicker
                  selected={exerciseSelectedYear}
                  onChange={(date) => setExerciseSelectedYear(date)}
                  dateFormat="yyyy"
                  locale="ru"
                  showYearPicker
                  className={styles.datePicker}
                  placeholderText="Выберите год"
                />
              )}
            </div>
            <input
              type="text"
              list="exercises"
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              placeholder="Поиск упражнения, например, Жим лежа"
              className={styles.searchInput}
            />
            <datalist id="exercises">
              {availableExercises.map((exercise) => (
                <option key={exercise} value={exercise} />
              ))}
            </datalist>
            {exerciseSearch && (
              <TransitionGroup>
                <CSSTransition timeout={300} classNames="fade">
                  <div className={`${styles.chartContainer} ${styles.exerciseChart} ${tappedDataByChart.exercise ? styles.activeChart : ''}`}>
                    {getExerciseStats().labels.length > 0 ? (
                      <Line data={getExerciseStats()} options={chartOptions} />
                    ) : (
                      <p className={styles.noDataMessage}>Нет данных для этого упражнения</p>
                    )}
                    <TransitionGroup>
                      {tappedDataByChart.exercise && (
                        <CSSTransition timeout={300} classNames="notification">
                          <div className={styles.tappedData}>
                            <span>
                              {tappedDataByChart.exercise.label}: {tappedDataByChart.exercise.value} {tappedDataByChart.exercise.unit} ({tappedDataByChart.exercise.date})
                            </span>
                            <button
                              className={styles.closeButton}
                              onClick={() => handleCloseTappedData('exercise')}
                            >
                              ×
                            </button>
                          </div>
                        </CSSTransition>
                      )}
                    </TransitionGroup>
                  </div>
                </CSSTransition>
              </TransitionGroup>
            )}
          </section>
        </>
      ) : (
        <div className={styles.noWorkouts}>
          <h1 className={styles.noWorkoutsMessage}>
            Чтобы появилась аналитика, создайте свою первую тренировку
          </h1>
          <button
            className={styles.createFirstWorkoutButton}
            onClick={() => navigate('/home')}
          >
            Вернуться на главную
          </button>
        </div>
      )}
    </div>
  );
};

export default Analytics;