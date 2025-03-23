import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from './Spinner';
import styles from './Register.module.css';

const Register = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [errors, setErrors] = useState({});
  const [isMessageVisible, setIsMessageVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const validateForm = () => {
    const errors = {};
    if (!name) {
      errors.name = 'Введите имя';
    }
    if (!email) {
      errors.email = 'Введите email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Введите корректный email';
    }
    if (!password) {
      errors.password = 'Введите пароль';
    } else if (password.length < 6) {
      errors.password = 'Пароль должен быть не менее 6 символов';
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (loading) return;

    if (!validateForm()) {
      setMessage('Пожалуйста, исправьте ошибки в форме');
      setMessageType('error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Регистрация прошла успешно');
        setMessageType('success');

        // Выполняем автоматический вход
        localStorage.setItem('jwt', data.token);
        onLogin(data.token);

        setTimeout(() => {
          navigate('/home');
        }, 2000);
      } else {
        setMessage(data.message || 'Ошибка регистрации. Попробуйте снова');
        setMessageType('error');
        setLoading(false);
      }
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      setMessage('Произошла ошибка при регистрации. Попробуйте позже');
      setMessageType('error');
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'name') {
      setName(value);
      setErrors((prevErrors) => ({ ...prevErrors, name: '' }));
    }
    if (field === 'email') {
      setEmail(value);
      setErrors((prevErrors) => ({ ...prevErrors, email: '' }));
    }
    if (field === 'password') {
      setPassword(value);
      setErrors((prevErrors) => ({ ...prevErrors, password: '' }));
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Регистрация</h2>
      <input
        type="text"
        placeholder="Имя"
        value={name}
        onChange={(e) => handleInputChange('name', e.target.value)}
        className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
      />
      {errors.name && <p className={styles.errorText}>{errors.name}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => handleInputChange('email', e.target.value)}
        className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
      />
      {errors.email && <p className={styles.errorText}>{errors.email}</p>}
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => handleInputChange('password', e.target.value)}
        className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
      />
      {errors.password && <p className={styles.errorText}>{errors.password}</p>}
      <button onClick={handleRegister} className={styles.button} disabled={loading}>
        {loading ? <Spinner darkMode={true} isButton={true} /> : 'Зарегистрироваться'}
      </button>
      <button onClick={() => navigate('/login')} className={styles.backButton}>
        Вернуться на страницу входа
      </button>
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
  );
};

export default Register;