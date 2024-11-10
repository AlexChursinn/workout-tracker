// src/components/WorkoutTable.js
import React from 'react';
import { useWorkoutTable } from '../hooks/useWorkoutTable';
import ExerciseModal from './ExerciseModal';
import styles from './WorkoutTable.module.css';
import copyIcon from '../assets/copy.svg';
import deleteIcon from '../assets/delete.svg';
import muscleGroups from '../constants/muscleGroups'; // Импортируем константу

const WorkoutTable = ({ date, workoutData = [], onWorkoutChange }) => {
  const {
    workouts,
    modalData,
    handleAddRow,
    handleDeleteRow,
    handleCellClick,
    updateWorkout,
    handleAddSet,
    handleDeleteSet,
    handleCopySet,
    setModalData
  } = useWorkoutTable(workoutData, onWorkoutChange);

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
            <td data-label="№">{workout.id}</td>
            <td data-label="Группа Мышц">
              <select
                value={workout.muscleGroup}
                onChange={(e) =>
                  updateWorkout(
                    workout.id,
                    null,
                    null,
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
                  updateWorkout(
                    workout.id,
                    null,
                    null,
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
