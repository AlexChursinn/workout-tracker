import React, { useState, useEffect } from 'react';
import styles from './WorkoutTable.module.css';
import copyIcon from '../assets/copy.svg';
import deleteIcon from '../assets/delete.svg';
import numberIcon from '../assets/numberIcon.svg';

const muscleGroups = {
  "Грудь": ["Жим штанги лежа Горизонт", "Жим штанги лежа 45", "Жим штанги лежа Низ", "Жим гантелей 15", "Жим гантелей 30", "Жим гантелей 45", "Брусья", "Разводка гантелей Горизонт", "Разводка гантелей 15", "Сведение рук в кроссовере", "Бабочка", "Отжимания"],
  "Спина": ["Тяга верхнего блока", "Тяга одной рукой в тренажере", "Тяга горизонтального блока", "Тяга одной рукой в наклоне", "Тяга гантели одной рукой в наклоне", "Тяга штанги в наклоне", "Становая тяга", "Подтягивания", "Вис на турнике"],
  "Ноги": ["Присед", "Разгибание ног", "Задняя поверхность бедра (стоя одной ногой в тренажере)", "Задняя поверхность бедра (Двумя ногами)", "Выпады с гантелями", "Жим ногами в тренажере"],
  "Руки": ["Подъем гантелей на скамье 45", "Изогнутый гриф на скамье Скотта", "Скамья Скотта тренажер", "Молотки сидя на скамье", "Молотки стоя", "Подъем прямого грифа стоя", "Подъем изогнутого грифа"],
  "Плечи": ["Жим штанги сидя на скамье", "Жим гантелей сидя на скамье", "Подъем гантелей перед собой сидя на скамье на плечи", "Подъем гантелей в стороны стоя Махи", "Задняя дельта сидя на скамье", "Тяга к подбородку", "Подъем гантелей на трапецию стоя"],
  "Прочее": ["Гиперэкстензия", "Растяжка 30 сек", "Растяжка 1 минута", "Пресс (турник)", "Пресс (брусья)", "Икры со штангой в двух вариациях", "Икры в тренажере", "Икры со штангой", "Икры стоя"]
};

const WorkoutTable = ({ date, workoutData = [], onWorkoutChange }) => {
  const [workouts, setWorkouts] = useState(Array.isArray(workoutData) ? workoutData : []);

  useEffect(() => {
    setWorkouts(Array.isArray(workoutData) ? workoutData : []);
  }, [workoutData]);

  const handleWorkoutUpdate = (updatedWorkouts) => {
    setWorkouts(updatedWorkouts);
    onWorkoutChange(updatedWorkouts);
  };

  const handleAddRow = () => {
    handleWorkoutUpdate([
      ...workouts,
      { id: workouts.length + 1, muscleGroup: '', exercise: '', sets: [{ reps: '', weight: '', isEditing: true }] }
    ]);
  };

  const handleDeleteRow = (workoutId) => {
    const updatedWorkouts = workouts
      .filter((workout) => workout.id !== workoutId)
      .map((workout, index) => ({ ...workout, id: index + 1 }));
    handleWorkoutUpdate(updatedWorkouts);
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
        ? { ...workout, sets: [...workout.sets, { reps: '', weight: '', isEditing: true }] }
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
        const newSet = lastSet ? { ...lastSet, isEditing: true } : { reps: '', weight: '', isEditing: true };
        workout.sets = [...workout.sets, newSet];
      }
      return workout;
    });
    handleWorkoutUpdate(updatedWorkouts);
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
          <th>Удалить</th>
        </tr>
      </thead>
      <tbody>
        {workouts.map((workout) => (
          <tr key={workout.id}>
            <td data-label="№" className={styles.numberCell}>
              <img
                src={numberIcon}
                alt="Workout Icon"
                className={styles.numberIcon}
              />
              <span className={styles.numberText}>{workout.id}</span>
            </td>
            <td data-label="Группа Мышц">
              <select
                value={workout.muscleGroup}
                onChange={(e) =>
                  handleWorkoutUpdate(
                    workouts.map(w => w.id === workout.id ? { ...w, muscleGroup: e.target.value, exercise: '' } : w)
                  )
                }
              >
                <option value="">Выберите группу мышц</option>
                {Object.keys(muscleGroups).map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </td>
            <td data-label="Упражнение">
              <select
                value={workout.exercise}
                onChange={(e) =>
                  handleWorkoutUpdate(
                    workouts.map(w => w.id === workout.id ? { ...w, exercise: e.target.value } : w)
                  )
                }
                disabled={!workout.muscleGroup}
              >
                <option value="">Выберите упражнение</option>
                {workout.muscleGroup && muscleGroups[workout.muscleGroup].map((exercise) => (
                  <option key={exercise} value={exercise}>{exercise}</option>
                ))}
              </select>
            </td>
            {workout.sets.map((set, i) => (
              <td key={i}>
                <div className={styles.setContainer}>
                  {/* Номер подхода для малых экранов */}
                  <span className={`${styles.circle} ${styles.hideOnLargeScreens}`}>{i + 1}</span>
                  {set.isEditing || !set.reps || !set.weight ? (
                    <div class="inputContainer">
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
                        onBlur={() => {
                          if (set.reps && set.weight) {
                            handleSetChange(workout.id, i, 'isEditing', false);
                          }
                        }}
                        onChange={(e) => handleSetChange(workout.id, i, 'weight', e.target.value)}
                      />
                    </div>
                  ) : (
                    <span
                      className={styles.setText}
                      onClick={() => handleSetChange(workout.id, i, 'isEditing', true)}
                    >
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
                    <img src={copyIcon} alt="Copy" className={styles.copyIcon} />
                  </button>
                )}
                {workout.sets.length > 1 && (
                  <button className={styles.deleteSetButton} onClick={() => handleDeleteSet(workout.id)}>-</button>
                )}
              </div>
            </td>
            <td className={styles.centeredCell}>
              <button className={styles.deleteButton} onClick={() => handleDeleteRow(workout.id)}>
                <img src={deleteIcon} alt="Delete" className={styles.deleteIcon} />
              </button>
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
