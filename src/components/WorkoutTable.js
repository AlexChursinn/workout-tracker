import React, { useState, useEffect, useRef } from 'react';
import styles from './WorkoutTable.module.css';
import copyIconBlack from '../assets/copy-black.svg';
import copyIconWhite from '../assets/copy-white.svg';
import deleteIconBlack from '../assets/delete-black.svg';
import deleteIconWhite from '../assets/delete-white.svg';
import numberIcon from '../assets/numberIcon.svg';
import settingIcon from '../assets/setting.svg';

const WorkoutTable = ({ date, workoutData = [], onWorkoutChange, defaultMuscleGroups, customMuscleGroups, darkMode }) => {
  const [workouts, setWorkouts] = useState(Array.isArray(workoutData) ? workoutData : []);
  const [showDropdown, setShowDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const weightTypeOptions = ['Вес', 'Доп. вес', 'Соб. вес', 'Гриф', 'Резинки'];

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDropdown(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowDropdown(null);
      }
    };

    const handleScroll = () => {
      setShowDropdown(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleWorkoutUpdate = async (updatedWorkouts) => {
    setWorkouts(updatedWorkouts);
    onWorkoutChange(updatedWorkouts);
  };

  const handleAddRow = () => {
    const newNumber = workouts.length + 1;
    handleWorkoutUpdate([
      ...workouts,
      {
        id: Date.now(),
        number: newNumber,
        muscleGroup: '',
        exercise: '',
        sets: [{ reps: '', weight: '', weightType: 'Вес', isEditing: true }],
      },
    ]);
  };

  const handleDeleteRow = (workoutId) => {
    const updatedWorkouts = workouts
      .filter((workout) => workout.id !== workoutId)
      .map((workout, index) => ({ ...workout, number: index + 1 }));
    handleWorkoutUpdate(updatedWorkouts);
    setShowDropdown(null);
  };

  const handleSetChange = (workoutId, setIndex, field, value) => {
    const updatedWorkouts = workouts.map((workout) =>
      workout.id === workoutId
        ? {
            ...workout,
            sets: workout.sets.map((set, i) =>
              i === setIndex ? { ...set, [field]: value } : set
            ),
          }
        : workout
    );
    handleWorkoutUpdate(updatedWorkouts);
  };

  const handleAddSet = (workoutId) => {
    const updatedWorkouts = workouts.map((workout) =>
      workout.id === workoutId
        ? {
            ...workout,
            sets: [...workout.sets, { reps: '', weight: '', weightType: 'Вес', isEditing: true }],
          }
        : workout
    );
    handleWorkoutUpdate(updatedWorkouts);
  };

  const handleDeleteSet = (workoutId) => {
    const updatedWorkouts = workouts.map((workout) =>
      workout.id === workoutId && workout.sets.length > 1
        ? { ...workout, sets: workout.sets.slice(0, -1) }
        : workout
    );
    handleWorkoutUpdate(updatedWorkouts);
  };

  const handleCopySet = (workoutId) => {
    const updatedWorkouts = workouts.map((workout) => {
      if (workout.id === workoutId && workout.sets.length > 0) {
        const lastSet = workout.sets[workout.sets.length - 1];
        const newSet = lastSet
          ? { ...lastSet, isEditing: true }
          : { reps: '', weight: '', weightType: 'Вес', isEditing: true };
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

  const toggleDropdown = (workoutId, event) => {
    event.stopPropagation();
    buttonRef.current = event.currentTarget;
    setShowDropdown((prev) => (prev === workoutId ? null : workoutId));
  };

  return (
    <div className={styles.tableContainer}>
      {workouts.length === 0 ? (
        <div className={styles.tableWrapper}>
          <div className={styles.emptyState}>
            <button className={styles.addExerciseButton} onClick={handleAddRow}>
              Добавить упражнение
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>№</th>
                <th>Группа Мышц</th>
                <th>Упражнение</th>
                {Array.from(
                  { length: Math.max(...workouts.map((w) => w.sets?.length || 1), 1) },
                  (_, i) => (
                    <th key={i}>Подход {i + 1}</th>
                  )
                )}
                <th>Управление подходами</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {workouts.map((workout) => (
                <tr key={workout.id}>
                  <td data-label="№" className={styles.numberCell}>
                    <img src={numberIcon} alt="Workout Icon" className={styles.numberIcon} />
                    <span className={styles.numberText}>
                      {workout.number || workouts.indexOf(workout) + 1}
                    </span>
                  </td>
                  <td data-label="Группа Мышц">
                    <select
                      value={workout.muscleGroup}
                      onChange={(e) =>
                        handleWorkoutUpdate(
                          workouts.map((w) =>
                            w.id === workout.id
                              ? { ...w, muscleGroup: e.target.value, exercise: '' }
                              : w
                          )
                        )
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
                        handleWorkoutUpdate(
                          workouts.map((w) =>
                            w.id === workout.id ? { ...w, exercise: e.target.value } : w
                          )
                        )
                      }
                      disabled={!workout.muscleGroup}
                    >
                      <option value="">Выберите упражнение</option>
                      {workout.muscleGroup &&
                        allMuscleGroups[workout.muscleGroup]?.map((exercise) => (
                          <option key={exercise} value={exercise}>{exercise}</option>
                        ))}
                    </select>
                  </td>
                  {workout.sets.map((set, i) => (
                    <td key={i}>
                      <div className={styles.setContainer}>
                        <span className={`${styles.circle} ${styles.hideOnLargeScreens}`}>
                          {i + 1}
                        </span>
                        {set.isEditing || !set.reps ? (
                          <div className={styles.inputContainer}>
                            <input
                              type="number"
                              placeholder="Повт."
                              className={styles.workoutTableInput}
                              value={set?.reps || ''}
                              onChange={(e) =>
                                handleSetChange(workout.id, i, 'reps', e.target.value)
                              }
                            />
                            {['Вес', 'Доп. вес'].includes(set.weightType) && (
                              <input
                                type="number"
                                placeholder="Вес"
                                className={styles.workoutTableInput}
                                value={set?.weight || ''}
                                onChange={(e) =>
                                  handleSetChange(workout.id, i, 'weight', e.target.value)
                                }
                                onBlur={() => {
                                  if (set.reps) {
                                    handleSetChange(workout.id, i, 'isEditing', false);
                                  }
                                }}
                              />
                            )}
                            <select
                              value={set.weightType}
                              onChange={(e) =>
                                handleSetChange(workout.id, i, 'weightType', e.target.value)
                              }
                              className={styles.weightTypeSelect}
                              onBlur={() => {
                                if (set.reps) {
                                  handleSetChange(workout.id, i, 'isEditing', false);
                                }
                              }}
                            >
                              {weightTypeOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span
                            className={styles.setText}
                            onClick={() => handleSetChange(workout.id, i, 'isEditing', true)}
                          >
                            {set.reps && ['Вес', 'Доп. вес'].includes(set.weightType)
                              ? `${set.reps} х ${set.weight} (${set.weightType})`
                              : `${set.reps} (${set.weightType})`}
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                  <td>
                    <div className={styles.setControls}>
                      <button
                        className={styles.addSetButton}
                        onClick={() => handleAddSet(workout.id)}
                      >
                        +
                      </button>
                      {workout.sets.length > 0 && (
                        <button
                          className={styles.copySetButton}
                          onClick={() => handleCopySet(workout.id)}
                        >
                          <img src={copyIconWhite} alt="Copy" className={styles.copyIcon} />
                        </button>
                      )}
                      {workout.sets.length > 1 && (
                        <button
                          className={styles.deleteSetButton}
                          onClick={() => handleDeleteSet(workout.id)}
                        >
                          -
                        </button>
                      )}
                    </div>
                  </td>
                  <td className={styles.CenteredCell}>
                    <div
                      className={`${styles.dropdownContainer} ${
                        showDropdown === workout.id ? styles.activeDropdown : ''
                      }`}
                    >
                      <button
                        className={styles.moreButton}
                        onClick={(e) => toggleDropdown(workout.id, e)}
                        ref={showDropdown === workout.id ? buttonRef : null}
                      >
                        <img src={settingIcon} alt="Settings" className={styles.settingIcon} />
                      </button>
                      {showDropdown === workout.id && (
                        <div className={styles.dropdownMenu} ref={dropdownRef}>
                          <button
                            className={styles.dropdownItem}
                            onClick={() => handleCopyWorkout(workout.id)}
                          >
                            <span>Копировать</span>
                            <img
                              src={darkMode ? copyIconWhite : copyIconBlack}
                              alt="Copy"
                              className={styles.copyIcon}
                            />
                          </button>
                          <button
                            className={styles.dropdownItem}
                            onClick={() => handleDeleteRow(workout.id)}
                          >
                            <span>Удалить</span>
                            <img
                              src={darkMode ? deleteIconWhite : deleteIconBlack}
                              alt="Delete"
                              className={styles.deleteIcon}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              <tr>
                <td
                  colSpan={5 + Math.max(...workouts.map((w) => w.sets?.length || 1), 1)}
                  style={{ textAlign: 'center' }}
                >
                  <button className={styles.addExerciseButton} onClick={handleAddRow}>
                    Добавить упражнение
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WorkoutTable;