import React, { useState } from 'react';
import styles from './ExerciseModal.module.css';

const ExerciseModal = ({ workoutId, setIndex, onSave, onClose }) => {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [isInvalid, setIsInvalid] = useState({ reps: false, weight: false });
 
  const handleSave = () => {
    const hasError = !reps || !weight;
    setIsInvalid({
      reps: !reps,
      weight: !weight,
    });

    if (!hasError) {
      onSave(workoutId, setIndex, reps, weight);
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Подход {setIndex + 1}</h2>
        <label>
          Повторения:
          <input
            type="number"
            value={reps}
            onChange={(e) => {
              setReps(e.target.value);
              setIsInvalid((prev) => ({ ...prev, reps: false }));
            }}
            min="0"
            className={isInvalid.reps ? styles.invalidInput : ''}
          />
        </label>
        <label>
          Вес:
          <input
            type="number"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              setIsInvalid((prev) => ({ ...prev, weight: false }));
            }}
            min="0"
            className={isInvalid.weight ? styles.invalidInput : ''}
          />
        </label>
        <button onClick={handleSave}>Сохранить</button>
        <button onClick={onClose}>Отмена</button>
      </div>
    </div>
  );
};

export default ExerciseModal;
 