import React, { useState, useEffect } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import styles from './Exercises.module.css';
import arrowDownIcon from '../assets/arrowDown.svg';
import arrowUpIcon from '../assets/arrowUp.svg';
import deleteIcon from '../assets/delete.svg';
import Spinner from './Spinner';

const Exercises = ({ darkMode, defaultMuscleGroups, customMuscleGroups, onMuscleGroupsChange, loading }) => {
  const [muscleGroups, setMuscleGroups] = useState(customMuscleGroups);
  const [newGroup, setNewGroup] = useState('');
  const [newExercise, setNewExercise] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isMessageVisible, setIsMessageVisible] = useState(false);

  useEffect(() => {
    setMuscleGroups(customMuscleGroups);
  }, [customMuscleGroups]);

  useEffect(() => {
    if (message) {
      setIsMessageVisible(true);
      const timer = setTimeout(() => {
        setIsMessageVisible(false);
        setTimeout(() => setMessage(''), 500);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const allMuscleGroups = Object.keys({ ...defaultMuscleGroups, ...muscleGroups }).reduce((acc, group) => {
    const defaultExercises = defaultMuscleGroups[group] || [];
    const customExercises = muscleGroups[group] || [];
    acc[group] = [...new Set([...defaultExercises, ...customExercises])];
    return acc;
  }, {});

  const validateGroupForm = () => {
    const errors = {};
    if (!newGroup.trim()) {
      errors.newGroup = 'Введите название группы';
    } else if (defaultMuscleGroups[newGroup.trim()] || muscleGroups[newGroup.trim()]) {
      errors.newGroup = 'Такая группа уже существует';
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateExerciseForm = () => {
    const errors = {};
    if (!selectedGroup) {
      errors.selectedGroup = 'Выберите группу';
    }
    if (!newExercise.trim()) {
      errors.newExercise = 'Введите название упражнения';
    } else {
      const existingDefaultExercises = defaultMuscleGroups[selectedGroup] || [];
      const existingCustomExercises = muscleGroups[selectedGroup] || [];
      const allExercises = [...existingDefaultExercises, ...existingCustomExercises];
      if (allExercises.includes(newExercise.trim())) {
        errors.newExercise = 'Такое упражнение уже существует в этой группе';
      }
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddGroup = async () => {
    if (!validateGroupForm()) {
      setMessage('Пожалуйста, исправьте ошибки');
      setMessageType('error');
      return;
    }
    const updatedGroups = { ...muscleGroups, [newGroup.trim()]: [] };
    try {
      setMuscleGroups(updatedGroups);
      await onMuscleGroupsChange(updatedGroups);
      setMessage(`Группа "${newGroup.trim()}" добавлена`);
      setMessageType('success');
      setNewGroup('');
      setErrors({});
    } catch (error) {
      setMessage('Ошибка при добавлении группы');
      setMessageType('error');
    }
  };

  const handleAddExercise = async () => {
    if (!validateExerciseForm()) {
      setMessage('Пожалуйста, исправьте ошибки');
      setMessageType('error');
      return;
    }
    const existingCustomExercises = muscleGroups[selectedGroup] || [];
    const updatedGroups = {
      ...muscleGroups,
      [selectedGroup]: [...existingCustomExercises, newExercise.trim()],
    };
    try {
      setMuscleGroups(updatedGroups);
      await onMuscleGroupsChange(updatedGroups);
      setMessage(`Упражнение "${newExercise.trim()}" добавлено в группу "${selectedGroup}"`);
      setMessageType('success');
      setNewExercise('');
      setErrors({});
    } catch (error) {
      setMessage('Ошибка при добавлении упражнения');
      setMessageType('error');
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!defaultMuscleGroups[group]) {
      const updatedGroups = { ...muscleGroups };
      delete updatedGroups[group];
      try {
        setMuscleGroups(updatedGroups);
        await onMuscleGroupsChange(updatedGroups);
        setMessage(`Группа "${group}" удалена`);
        setMessageType('success');
        if (selectedGroup === group) setSelectedGroup('');
        if (expandedGroup === group) setExpandedGroup(null);
      } catch (error) {
        setMessage('Ошибка при удалении группы');
        setMessageType('error');
      }
    }
  };

  const handleDeleteExercise = async (group, exercise) => {
    if (!defaultMuscleGroups[group]?.includes(exercise)) {
      const updatedGroups = {
        ...muscleGroups,
        [group]: muscleGroups[group].filter((ex) => ex !== exercise),
      };
      try {
        setMuscleGroups(updatedGroups);
        await onMuscleGroupsChange(updatedGroups);
        setMessage(`Упражнение "${exercise}" удалено из группы "${group}"`);
        setMessageType('success');
      } catch (error) {
        setMessage('Ошибка при удалении упражнения');
        setMessageType('error');
      }
    } else {
      setMessage('Нельзя удалить дефолтное упражнение');
      setMessageType('error');
    }
  };

  const toggleGroup = (group) => {
    setExpandedGroup((prev) => (prev === group ? null : group));
  };

  const handleInputChange = (field, value) => {
    if (field === 'newGroup') {
      setNewGroup(value);
      setErrors((prev) => ({ ...prev, newGroup: '' }));
    } else if (field === 'newExercise') {
      setNewExercise(value);
      setErrors((prev) => ({ ...prev, newExercise: '' }));
    } else if (field === 'selectedGroup') {
      setSelectedGroup(value);
      setErrors((prev) => ({ ...prev, selectedGroup: '' }));
    }
  };

  if (loading) {
    return <Spinner darkMode={darkMode} />;
  }

  return (
    <div className={darkMode ? styles.containerDark : styles.containerLight}>
      <h1 className={styles.mainTitle}>Список упражнений</h1>
      <div className={styles.contentWrapper}>
        <div className={styles.exerciseGroups}>
          <TransitionGroup>
            {Object.entries(allMuscleGroups).map(([group, exercises]) => (
              <CSSTransition
                key={group}
                timeout={500}
                classNames="block"
              >
                <div className={darkMode ? styles.workoutBlockDark : styles.workoutBlockLight}>
                  <div className={styles.groupHeader}>
                    <h3 className={darkMode ? styles.workoutTitleDark : styles.workoutTitleLight}>{group}</h3>
                    <div className={styles.groupControls}>
                      {exercises.length > 0 && (
                        <button className={styles.toggleButton} onClick={() => toggleGroup(group)}>
                          <img
                            src={expandedGroup === group ? arrowUpIcon : arrowDownIcon}
                            alt={expandedGroup === group ? 'Collapse' : 'Expand'}
                            className={styles.toggleIcon}
                          />
                        </button>
                      )}
                      {!defaultMuscleGroups[group] && (
                        <button className={styles.deleteButton} onClick={() => handleDeleteGroup(group)}>
                          <img src={deleteIcon} alt="Delete" className={styles.deleteIcon} />
                        </button>
                      )}
                    </div>
                  </div>
                  {expandedGroup === group && (
                    <div className={styles.workoutBlockContent}>
                      {exercises.map((exercise, index) => (
                        <div key={index} className={darkMode ? styles.exerciseCardDark : styles.exerciseCardLight}>
                          <h3 className={darkMode ? styles.exerciseTitleDark : styles.exerciseTitleLight}>{exercise}</h3>
                          {!defaultMuscleGroups[group]?.includes(exercise) && (
                            <button className={styles.deleteButton} onClick={() => handleDeleteExercise(group, exercise)}>
                              <img src={deleteIcon} alt="Delete" className={styles.deleteIcon} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CSSTransition>
            ))}
          </TransitionGroup>
        </div>
      </div>
      <div className={styles.modalButtonContainer}>
        <button className={darkMode ? styles.openModalButtonDark : styles.openModalButtonLight} onClick={() => setIsModalOpen(true)}>
          +
        </button>
      </div>
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={darkMode ? styles.modalTitleDark : styles.modalTitleLight}>Добавить группу или упражнение</h2>
            <select
              value={selectedGroup}
              onChange={(e) => handleInputChange('selectedGroup', e.target.value)}
              className={`${styles.input} ${errors.selectedGroup ? styles.inputError : ''}`}
            >
              <option value="">Выберите группу</option>
              {Object.keys(allMuscleGroups).map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
            {errors.selectedGroup && <p className={styles.errorText}>{errors.selectedGroup}</p>}
            <input
              type="text"
              value={newGroup}
              onChange={(e) => handleInputChange('newGroup', e.target.value)}
              placeholder="Название новой группы"
              className={`${styles.input} ${errors.newGroup ? styles.inputError : ''}`}
            />
            {errors.newGroup && <p className={styles.errorText}>{errors.newGroup}</p>}
            <input
              type="text"
              value={newExercise}
              onChange={(e) => handleInputChange('newExercise', e.target.value)}
              placeholder="Название нового упражнения"
              className={`${styles.input} ${errors.newExercise ? styles.inputError : ''}`}
            />
            {errors.newExercise && <p className={styles.errorText}>{errors.newExercise}</p>}
            <div className={styles.modalButtons}>
              <button className={darkMode ? styles.addButtonDark : styles.addButtonLight} onClick={handleAddGroup}>
                Добавить группу
              </button>
              <button className={darkMode ? styles.addButtonDark : styles.addButtonLight} onClick={handleAddExercise}>
                Добавить упражнение
              </button>
              <button className={darkMode ? styles.closeModalButtonDark : styles.closeModalButtonLight} onClick={() => setIsModalOpen(false)}>
                Закрыть
              </button>
            </div>
            {message && (
              <p
                className={`${styles.message} ${isMessageVisible ? styles.messageVisible : ''} ${
                  messageType === 'success' ? styles.successMessage : styles.errorMessage
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Exercises;