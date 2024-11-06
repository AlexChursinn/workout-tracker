import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Login.module.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' или 'error'
  const [isMessageVisible, setIsMessageVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (message) {
      setIsMessageVisible(true);
      const timer = setTimeout(() => {
        setIsMessageVisible(false);
        setTimeout(() => setMessage(''), 500); // Убираем текст после исчезновения
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const validateForm = () => {
    const errors = {};
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

  const handleLogin = async () => {
    if (!validateForm()) {
      setMessage('Пожалуйста, исправьте ошибки в форме');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/login`, { // Используйте переменную окружения
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('jwt', data.token);
        onLogin(data.token);
        setMessage('Вход выполнен успешно');
        setMessageType('success');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setMessage(data.message || 'Ошибка входа. Проверьте ваши данные и попробуйте снова.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Произошла ошибка при входе. Попробуйте позже.');
      setMessageType('error');
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'email') {
      setEmail(value);
      setErrors(prevErrors => ({ ...prevErrors, email: '' }));
    }
    if (field === 'password') {
      setPassword(value);
      setErrors(prevErrors => ({ ...prevErrors, password: '' }));
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Вход</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => handleInputChange('email', e.target.value)}
        className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
      />
      {errors.email && <p className={styles.errorText}>{errors.email}</p>}
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={e => handleInputChange('password', e.target.value)}
        className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
      />
      {errors.password && <p className={styles.errorText}>{errors.password}</p>}
      <button onClick={handleLogin} className={styles.button}>Войти</button>
      <div>
        <Link to="/register" className={styles.link}>Зарегистрироваться</Link>
      </div>
      {message && (
        <p className={`${styles.message} ${isMessageVisible ? styles.messageVisible : ''} ${messageType === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default Login;
