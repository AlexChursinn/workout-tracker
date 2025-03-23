import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Spinner from './Spinner';
import styles from './Login.module.css';
import showIcon from '../assets/show.svg';
import hideIcon from '../assets/hidden.svg'; 

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isMessageVisible, setIsMessageVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Для отображения пароля
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

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
    if (loading) return;

    if (!validateForm()) {
      setMessage('Пожалуйста, исправьте ошибки в форме');
      setMessageType('error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('jwt', data.token);
        if (rememberMe) {
          localStorage.setItem('savedEmail', email);
          localStorage.setItem('savedPassword', password);
        } else {
          localStorage.removeItem('savedEmail');
          localStorage.removeItem('savedPassword');
        }

        onLogin(data.token);
        setMessage('Вход выполнен успешно');
        setMessageType('success');

        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setMessage(data.message || 'Ошибка входа. Проверьте ваши данные и попробуйте снова');
        setMessageType('error');
        setLoading(false);
      }
    } catch (error) {
      setMessage('Произошла ошибка при входе. Попробуйте позже');
      setMessageType('error');
      setLoading(false);
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

  const toggleRememberMe = () => setRememberMe(prev => !prev);

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

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

      <div className={styles.passwordContainer}>
  <input
    type={showPassword ? 'text' : 'password'}
    placeholder="Пароль"
    value={password}
    onChange={e => handleInputChange('password', e.target.value)}
    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
  />
  <button
    type="button"
    className={styles.togglePassword}
    onClick={togglePasswordVisibility}
    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
  >
    <img
      src={showPassword ? showIcon : hideIcon}
      alt=""
    />
  </button>
</div>
      {errors.password && <p className={styles.errorText}>{errors.password}</p>}

      <div className={styles.checkboxContainer}>
        <input
          type="checkbox"
          id="rememberMe"
          className={styles.checkbox}
          checked={rememberMe}
          onChange={toggleRememberMe}
        />
        <label htmlFor="rememberMe" className={styles.checkboxLabel}>
          Запомнить меня
        </label>
      </div>

      <button onClick={handleLogin} className={styles.button} disabled={loading}>
        {loading ? <Spinner darkMode={true} isButton={true} /> : 'Войти'}
      </button>
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
