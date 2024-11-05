import React, { useState, useEffect } from 'react';
import ExerciseModal from './ExerciseModal';
import styles from './WorkoutTable.module.css';

const muscleGroups = {
  "Грудь": ["Жим штанги лежа Горизонт", "Жим штанги лежа 45", "Жим штанги лежа Низ", "Жим гантелей 15", "Жим гантелей 30", "Жим гантелей 45", "Брусья", "Разводка гантелей Горизонт", "Разводка гантелей 15", "Сведение рук в кроссовере", "Бабочка", "Отжимания"],
  "Спина": ["Тяга верхнего блока", "Тяга одной рукой в тренажере", "Тяга горизонтального блока", "Тяга одной рукой в наклоне", "Тяга гантели одной рукой в наклоне", "Тяга штанги в наклоне", "Становая тяга", "Подтягивания", "Вис на турнике"],
  "Ноги": ["Присед", "Разгибание ног", "Задняя поверхность бедра (стоя одной ногой в тренажере)", "Задняя поверхность бедра (Двумя ногами)", "Выпады с гантелями", "Жим ногами в тренажере"],
  "Руки": ["Подъем гантелей на скамье 45", "Изогнутый гриф на скамье Скотта", "Скамья Скотта тренажер", "Молотки сидя на скамье", "Молотки стоя", "Подъем прямого грифа стоя", "Подъем изогнутого грифа"],
  "Плечи": ["Жим штанги сидя на скамье", "Жим гантелей сидя на скамье", "Подъем гантелей перед собой сидя на скамье на плечи", "Подъем гантелей в стороны стоя Махи", "Задняя дельта сидя на скамье", "Тяга к подбородку", "Подъем гантелей на трапецию стоя"],
  "Прочее": ["Гиперэкстензия", "Растяжка 30 сек", "Растяжка 1 минута", "Пресс (турник)", "Пресс (брусья)", "Икры со штангой в двух вариациях", "Икры в тренажере", "Икры со штангой", "Икры стоя"]
};

const WorkoutTable = ({ date, workoutData, onWorkoutChange }) => {
  const [workouts, setWorkouts] = useState(workoutData);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    setWorkouts(workoutData);
  }, [workoutData]);

  const handleWorkoutUpdate = (updatedWorkouts) => {
    setWorkouts(updatedWorkouts);
    onWorkoutChange(updatedWorkouts);
  };

  const handleAddRow = () => {
    handleWorkoutUpdate([
      ...workouts,
      { id: workouts.length + 1, muscleGroup: '', exercise: '', sets: [null] }
    ]);
  };

  const handleDeleteRow = (workoutId) => {
    const updatedWorkouts = workouts
      .filter((workout) => workout.id !== workoutId)
      .map((workout, index) => ({ ...workout, id: index + 1 }));
    handleWorkoutUpdate(updatedWorkouts);
  };

  const handleCellClick = (workoutId, setIndex) => {
    setModalData({ workoutId, setIndex });
  };

  const updateWorkout = (workoutId, setIndex, reps, weight) => {
    const updatedWorkouts = workouts.map((workout) =>
      workout.id === workoutId
        ? { ...workout, sets: workout.sets.map((set, i) => (i === setIndex ? { reps, weight } : set)) }
        : workout
    );
    handleWorkoutUpdate(updatedWorkouts);
    setModalData(null);
  };

  const handleAddSet = (workoutId) => {
    const updatedWorkouts = workouts.map((workout) =>
      workout.id === workoutId
        ? { ...workout, sets: [...workout.sets, null] }
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

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>№</th>
          <th>Группа Мышц</th>
          <th>Упражнение</th>
          {Array.from({ length: Math.max(...workouts.map(w => w.sets.length), 1) }, (_, i) => (
            <th key={i}>Подход {i + 1}</th>
          ))}
          <th>Добавить подход</th>
          <th>Удалить</th>
        </tr>
      </thead>
      <tbody>
        {workouts.map((workout) => (
          <tr key={workout.id}>
            <td data-label="№">{workout.id}</td>
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
              <td key={i} data-label={`Подход ${i + 1}`} onClick={() => handleCellClick(workout.id, i)}>
                {set ? `${set.reps} x ${set.weight}` : 'Добавить'}
              </td>
            ))}
            <td>
              <div className={styles.setControls}>
                <button className={styles.addSetButton} onClick={() => handleAddSet(workout.id)}>+</button>
                {workout.sets.length > 1 && (
                  <button className={styles.deleteSetButton} onClick={() => handleDeleteSet(workout.id)}>-</button>
                )}
              </div>
            </td>
            <td>
              <button className={styles.deleteButton} onClick={() => handleDeleteRow(workout.id)}>Удалить</button>
            </td>
          </tr>
        ))}
        <tr>
          <td colSpan={5 + Math.max(...workouts.map(w => w.sets.length), 1)} style={{ textAlign: 'center' }}>
            <button className={styles.addExerciseButton} onClick={handleAddRow}>Добавить упражнение</button>
          </td>
        </tr>
      </tbody>

      {modalData && (
        <ExerciseModal
          workoutId={modalData.workoutId}
          setIndex={modalData.setIndex}
          onSave={updateWorkout}
          onClose={() => setModalData(null)}
        />
      )}
    </table>
  );
};

export default WorkoutTable;
