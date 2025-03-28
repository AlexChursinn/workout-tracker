import React, { useState, useEffect } from 'react';
import styles from './WorkoutTable.module.css';
import copyIconBlack from '../assets/copy-black.svg'; // Черная иконка для светлой темы
import copyIconWhite from '../assets/copy-white.svg'; // Белая иконка для темной темы
import deleteIconBlack from '../assets/delete-black.svg'; // Черная иконка для светлой темы
import deleteIconWhite from '../assets/delete-white.svg'; // Белая иконка для темной темы
import numberIcon from '../assets/numberIcon.svg';
import settingIcon from '../assets/setting.svg';

const WorkoutTable = ({ date, workoutData = [], onWorkoutChange, defaultMuscleGroups, customMuscleGroups, darkMode }) => {
  const [workouts, setWorkouts] = useState(Array.isArray(workoutData) ? workoutData : []);
  const [showDropdown, setShowDropdown] = useState(null);

  // Логирование для проверки darkMode
  console.log('WorkoutTable darkMode:', darkMode);

  // Объединяем дефолтные и пользовательские группы мышц
  const allMuscleGroups = {};
  Object.keys(defaultMuscleGroups).forEach((group) => {
    allMuscleGroups[group] = [...defaultMuscleGroups[group]];
  });
  Object.keys(customMuscleGroups).forEach((group) => {
    const customExercises = customMuscleGroups[group] || [];
    if (allMuscleGroups[group]) {
      allMuscleGroups[group] = [...new Set([...allMuscleGroups[group], ...customExercises])];
    } else {
      allMuscleGroups[group] = [...customExercises];
    }
  });

  useEffect(() => {
    setWorkouts(Array.isArray(workoutData) ? workoutData : []);
  }, [workoutData]);

  const handleWorkoutUpdate = async (updatedWorkouts) => {
    setWorkouts(updatedWorkouts);
    onWorkoutChange(updatedWorkouts);
  };

  const handleAddRow = () => {
    const newNumber = workouts.length + 1;
    handleWorkoutUpdate([...workouts, { id: Date.now(), number: newNumber, muscleGroup: '', exercise: '', sets: [{ reps: '', weight: '', isEditing: true }] }]);
  };

  const handleDeleteRow = (workoutId) => {
    const updatedWorkouts = workouts.filter((workout) => workout.id !== workoutId).map((workout, index) => ({ ...workout, number: index + 1 }));
    handleWorkoutUpdate(updatedWorkouts);
    setShowDropdown(null);
  };

  const handleSetChange = (workoutId, setIndex, field, value) => {
    const updatedWorkouts = workouts.map((workout) =>
      workout.id === workoutId ? { ...workout, sets: workout.sets.map((set, i) => i === setIndex ? { ...set, [field]: value } : set) } : workout
    );
    handleWorkoutUpdate(updatedWorkouts);
  };

  const handleAddSet = (workoutId) => {
    const updatedWorkouts = workouts.map((workout) =>
      workout.id === workoutId ? { ...workout, sets: [...workout.sets, { reps: '', weight: '', isEditing: true }] } : workout
    );
    handleWorkoutUpdate(updatedWorkouts);
  };

  const handleDeleteSet = (workoutId) => {
    const updatedWorkouts = workouts.map((workout) =>
      workout.id === workoutId && workout.sets.length > 1 ? { ...workout, sets: workout.sets.slice(0, -1) } : workout
    );
    handleWorkoutUpdate(updatedWorkouts);
  };

  const handleCopySet = (workoutId) => {
    const updatedWorkouts = workouts.map((workout) => {
      if (workout.id === workoutId && workout.sets.length > 0) {
        const lastSet = workout.sets[workout.sets.length - 1];
        const newSet = lastSet ? { ...lastSet, isEditing: true } : { reps: '', weight: '', isEditing: true };
        workout.sets = [...workout.sets, newSet];
      }
      return workout;
    });
    handleWorkoutUpdate(updatedWorkouts);
  };

  const handleCopyWorkout = (workoutId) => {
    const workoutToCopy = workouts.find((workout) => workout.id === workoutId);
    if (workoutToCopy) {
      const newId = Date.now();
      const newNumber = workouts.length + 1;
      const newWorkout = { ...workoutToCopy, id: newId, number: newNumber };
      handleWorkoutUpdate([...workouts, newWorkout]);
    }
    setShowDropdown(null);
  };

  const toggleDropdown = (workoutId) => {
    setShowDropdown((prev) => (prev === workoutId ? null : workoutId));
  };

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>№</th>
          <th>Группа Мышц</th>
          <th>Упражнение</th>
          {Array.from({ length: Math.max(...workouts.map(w => w.sets?.length || 1), 1) }, (_, i) => (
            <th key={i}>Подход {i + 1}</th>
          ))}
          <th>Управление подходами</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        {workouts.map((workout) => (
          <tr key={workout.id}>
            <td data-label="№" className={styles.numberCell}>
              <img src={numberIcon} alt="Workout Icon" className={styles.numberIcon} />
              <span className={styles.numberText}>{workout.number || workouts.indexOf(workout) + 1}</span>
            </td>
            <td data-label="Группа Мышц">
              <select
                value={workout.muscleGroup}
                onChange={(e) =>
                  handleWorkoutUpdate(workouts.map(w => w.id === workout.id ? { ...w, muscleGroup: e.target.value, exercise: '' } : w))
                }
              >
                <option value="">Выберите группу мышц</option>
                {Object.keys(allMuscleGroups).map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </td>
            <td data-label="Упражнение">
              <select
                value={workout.exercise}
                onChange={(e) =>
                  handleWorkoutUpdate(workouts.map(w => w.id === workout.id ? { ...w, exercise: e.target.value } : w))
                }
                disabled={!workout.muscleGroup}
              >
                <option value="">Выберите упражнение</option>
                {workout.muscleGroup && allMuscleGroups[workout.muscleGroup]?.map((exercise) => (
                  <option key={exercise} value={exercise}>{exercise}</option>
                ))}
              </select>
            </td>
            {workout.sets.map((set, i) => (
              <td key={i}>
                <div className={styles.setContainer}>
                  <span className={`${styles.circle} ${styles.hideOnLargeScreens}`}>{i + 1}</span>
                  {set.isEditing || !set.reps || !set.weight ? (
                    <div className="inputContainer">
                      <input
                        type="number"
                        placeholder="Повт."
                        className={styles.workoutTableInput}
                        value={set?.reps || ''}
                        onChange={(e) => handleSetChange(workout.id, i, 'reps', e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Вес"
                        className={styles.workoutTableInput}
                        value={set?.weight || ''}
                        onBlur={() => { if (set.reps && set.weight) handleSetChange(workout.id, i, 'isEditing', false); }}
                        onChange={(e) => handleSetChange(workout.id, i, 'weight', e.target.value)}
                      />
                    </div>
                  ) : (
                    <span className={styles.setText} onClick={() => handleSetChange(workout.id, i, 'isEditing', true)}>
                      {set.reps && set.weight ? `${set.reps} х ${set.weight}` : 'Введите данные'}
                    </span>
                  )}
                </div>
              </td>
            ))}
            <td>
              <div className={styles.setControls}>
                <button className={styles.addSetButton} onClick={() => handleAddSet(workout.id)}>+</button>
                {workout.sets.length > 0 && (
                  <button className={styles.copySetButton} onClick={() => handleCopySet(workout.id)}>
                    <img src={copyIconWhite} alt="Copy" className={styles.copyIcon} />
                  </button>
                )}
                {workout.sets.length > 1 && (
                  <button className={styles.deleteSetButton} onClick={() => handleDeleteSet(workout.id)}>-</button>
                )}
              </div> 
            </td>
            <td className={styles.centeredCell}>
              <div className={styles.dropdownContainer}>
                <button className={styles.moreButton} onClick={() => toggleDropdown(workout.id)}>
                  <img src={settingIcon} alt="Settings" className={styles.settingIcon} />
                </button>
                {showDropdown === workout.id && (
                  <div className={styles.dropdownMenu}>
                    <button className={styles.dropdownItem} onClick={() => handleCopyWorkout(workout.id)}>
                      <span>Копировать</span>
                      <img src={darkMode ? copyIconWhite : copyIconBlack} alt="Copy" className={styles.copyIcon} />
                    </button>
                    <button className={styles.dropdownItem} onClick={() => handleDeleteRow(workout.id)}>
                      <span>Удалить</span>
                      <img src={darkMode ? deleteIconWhite : deleteIconBlack} alt="Delete" className={styles.deleteIcon} />
                    </button>
                  </div>
                )}
              </div>
            </td>
          </tr>
        ))}
        <tr>
          <td colSpan={5 + Math.max(...workouts.map(w => w.sets?.length || 1), 1)} style={{ textAlign: 'center' }}>
            <button className={styles.addExerciseButton} onClick={handleAddRow}>Добавить упражнение</button>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default WorkoutTable;