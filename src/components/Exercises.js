import React, { useState, useEffect } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import styles from './Exercises.module.css';
import arrowDownIcon from '../assets/arrowDown.svg';
import arrowUpIcon from '../assets/arrowUp.svg';
import deleteIcon from '../assets/delete.svg';
import Spinner from './Spinner';

const Exercises = ({ darkMode, defaultMuscleGroups, customMuscleGroups, onMuscleGroupsChange, loading }) => {
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newExerciseName, setNewExerciseName] = useState('');
  const [allMuscleGroups, setAllMuscleGroups] = useState({});

  useEffect(() => {
    setAllMuscleGroups({ ...defaultMuscleGroups, ...customMuscleGroups });
  }, [defaultMuscleGroups, customMuscleGroups]);

  const toggleGroup = (group) => {
    setExpandedGroup(expandedGroup === group ? null : group);
  };

  const handleAddExercise = () => {
    if (newGroupName && newExerciseName) {
      const updatedGroups = {
        ...allMuscleGroups,
        [newGroupName]: [...(allMuscleGroups[newGroupName] || []), newExerciseName],
      };
      setAllMuscleGroups(updatedGroups);
      onMuscleGroupsChange(updatedGroups);
      setNewGroupName('');
      setNewExerciseName('');
      setIsModalOpen(false);
    }
  };

  const handleDeleteExercise = (group, exercise) => {
    const updatedGroups = {
      ...allMuscleGroups,
      [group]: allMuscleGroups[group].filter((ex) => ex !== exercise),
    };
    if (updatedGroups[group].length === 0) {
      delete updatedGroups[group];
    }
    setAllMuscleGroups(updatedGroups);
    onMuscleGroupsChange(updatedGroups);
  };

  const handleDeleteGroup = (group) => {
    const updatedGroups = { ...allMuscleGroups };
    delete updatedGroups[group];
    setAllMuscleGroups(updatedGroups);
    onMuscleGroupsChange(updatedGroups);
    if (expandedGroup === group) setExpandedGroup(null);
  };

  if (loading) {
    return <Spinner darkMode={darkMode} />;
  }

  return (
    <div className={darkMode ? styles.containerDark : styles.containerLight}>
      <h1 className={styles.mainTitle}>Список упражнений</h1>
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
      <div className={styles.modalButtonContainer}>
        <button className={darkMode ? styles.openModalButtonDark : styles.openModalButtonLight} onClick={() => setIsModalOpen(true)}>
          +
        </button>
      </div>
      {isModalOpen && (
        <div className={darkMode ? styles.modalDark : styles.modalLight}>
          <div className={styles.modalContent}>
            <h2>Добавить упражнение</h2>
            <input
              type="text"
              placeholder="Название группы мышц"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Название упражнения"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
            />
            <div className={styles.modalButtons}>
              <button onClick={handleAddExercise}>Добавить</button>
              <button onClick={() => setIsModalOpen(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exercises;