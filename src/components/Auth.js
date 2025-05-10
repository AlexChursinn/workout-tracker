import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import Spinner from './Spinner';
import styles from './Auth.module.css';
import showIcon from '../assets/show.svg';
import hideIcon from '../assets/hidden.svg';
import arrowLeft from '../assets/arrow-left.svg';

const Auth = ({ onLogin, darkMode }) => {
  const [step, setStep] = useState('email'); // email, otp, name
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']); // Array for 4 OTP digits
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isMessageVisible, setIsMessageVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTestAccount, setIsTestAccount] = useState(false);
  const navigate = useNavigate();
  const otpRefs = useRef([]);

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init('a9RNH2h1jh8xfMy6-');
  }, []);

  // Load saved email and block status
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    const savedBlockTime = localStorage.getItem('otpBlockTime');
    if (savedBlockTime && new Date().getTime() < parseInt(savedBlockTime)) {
      setIsBlocked(true);
      setBlockTime(parseInt(savedBlockTime));
      updateTimeLeft(parseInt(savedBlockTime));
    } else if (savedBlockTime) {
      localStorage.removeItem('otpBlockTime');
      setResendAttempts(0);
    }
  }, []);

  // Check for test account
  useEffect(() => {
    setIsTestAccount(email.toLowerCase() === 'test@gmail.com');
  }, [email]);

  // Auto-focus on first OTP field with delay for mobile compatibility
  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      const timer = setTimeout(() => {
        otpRefs.current[0].focus();
        otpRefs.current[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100); // Small delay to ensure DOM is ready
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Update time left for block
  const updateTimeLeft = (blockTime) => {
    const timeRemaining = Math.max(0, Math.floor((blockTime - new Date().getTime()) / 1000));
    setTimeLeft(timeRemaining);
  };

  // Resend timer
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Block timer
  useEffect(() => {
    if (isBlocked && blockTime) {
      const interval = setInterval(() => {
        updateTimeLeft(blockTime);
        if (blockTime - new Date().getTime() <= 0) {
          setIsBlocked(false);
          setBlockTime(null);
          setResendAttempts(0);
          setTimeLeft(null);
          localStorage.removeItem('otpBlockTime');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isBlocked, blockTime]);

  // Message visibility
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

  const validateEmail = () => {
    const errors = {};
    if (!email) {
      errors.email = 'Введите email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Введите корректный email';
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateName = () => {
    const errors = {};
    if (!name) {
      errors.name = 'Введите имя';
    } else if (name.length < 2) {
      errors.name = 'Имя должно содержать минимум 2 символа';
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generateOtp = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleEmailSubmit = async () => {
    if (loading || !validateEmail()) {
      setMessage('Пожалуйста, исправьте ошибки в форме');
      setMessageType('error');
      return;
    }

    if (isBlocked) {
      setMessage(`Отправка кодов заблокирована. Осталось: ${formatTimeLeft(timeLeft)}`);
      setMessageType('error');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    setLoading(true);
    try {
      let otpCode;
      if (isTestAccount) {
        otpCode = generateOtp();
        setMessage(`Ваш код: ${otpCode}`);
        setMessageType('success');
      } else {
        otpCode = generateOtp();
        await emailjs
          .send(
            'service_nbiuc0q',
            'template_d4ohedt',
            {
              to_email: email,
              otp_code: otpCode,
            }
          )
          .catch((error) => {
            console.error('Ошибка EmailJS:', error);
            throw new Error(`Ошибка отправки email: ${error.text || error.message}`);
          });
        setMessage(`Код отправлен на ${email}`);
        setMessageType('success');
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsNewUser(data.isNewUser);
        setStep('otp');
        setOtp(['', '', '', '']);
        setResendTimer(59);
        setResendAttempts((prev) => prev + 1);
      } else {
        setMessage(data.message || 'Ошибка при отправке кода');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Ошибка в handleEmailSubmit:', error);
      setMessage(error.message || 'Произошла ошибка. Попробуйте позже');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (loading || resendTimer > 0) return;

    if (isBlocked) {
      setMessage(`Отправка кодов заблокирована. Осталось: ${formatTimeLeft(timeLeft)}`);
      setMessageType('error');
      return;
    }

    if (resendAttempts >= 3) {
      const blockUntil = new Date().getTime() + 24 * 60 * 60 * 1000;
      setIsBlocked(true);
      setBlockTime(blockUntil);
      setResendAttempts(0);
      localStorage.setItem('otpBlockTime', blockUntil.toString());
      updateTimeLeft(blockUntil);
      setMessage(`Слишком много попыток. Попробуйте снова через ${formatTimeLeft(24 * 60 * 60)}`);
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      let otpCode;
      if (isTestAccount) {
        otpCode = generateOtp();
        setMessage(`Ваш новый код: ${otpCode}`);
        setMessageType('success');
      } else {
        otpCode = generateOtp();
        await emailjs
          .send(
            'service_nbiuc0q',
            'template_d4ohedt',
            {
              to_email: email,
              otp_code: otpCode,
            }
          )
          .catch((error) => {
            console.error('Ошибка EmailJS:', error);
            throw new Error(`Ошибка отправки email: ${error.text || error.message}`);
          });
        setMessage(`Новый код отправлен на ${email}`);
        setMessageType('success');
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await response.json();
      if (response.ok) {
        setResendTimer(59);
        setResendAttempts((prev) => prev + 1);
        setOtp(['', '', '', '']);
      } else {
        setMessage(data.message || 'Ошибка при отправке кода');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Ошибка в handleResendCode:', error);
      setMessage(error.message || 'Произошла ошибка. Попробуйте позже');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (loading) return;

    const otpValue = otp.join('');
    if (!otpValue) {
      setMessage('Введите код');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const data = await response.json();
      if (response.ok) {
        if (isNewUser) {
          setMessage('Код подтвержден. Введите ваше имя');
          setMessageType('success');
          setStep('name');
        } else {
          localStorage.setItem('jwt', data.accessToken);
          onLogin(data.accessToken);
          setMessage('Вход выполнен успешно');
          setMessageType('success');
          setTimeout(() => navigate('/home'), 2000);
        }
      } else {
        setMessage(data.message || 'Неверный код');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Ошибка в handleOtpSubmit:', error);
      setMessage('Произошла ошибка. Попробуйте позже');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async () => {
    if (loading) return;

    if (!validateName()) {
      setMessage('Пожалуйста, исправьте ошибки в форме');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/complete-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('jwt', data.accessToken);
        onLogin(data.accessToken);
        setMessage('Регистрация завершена успешно');
        setMessageType('success');
        setTimeout(() => navigate('/home'), 2000);
      } else {
        setMessage(data.message || 'Ошибка при завершении регистрации');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Ошибка в handleNameSubmit:', error);
      setMessage('Произошла ошибка. Попробуйте позже');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'email') {
      setEmail(value);
      setErrors((prev) => ({ ...prev, email: '' }));
    } else if (field === 'name') {
      setName(value);
      setErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const handleOtpInput = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{4}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      otpRefs.current[3].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    } else if (e.key === 'Enter' && otp.join('').length === 4) {
      handleOtpSubmit();
    }
  };

  const toggleOtpVisibility = () => setShowOtp((prev) => !prev);

  const handleKeyPress = (e, submitFunction) => {
    if (e.key === 'Enter') {
      submitFunction();
    }
  };

  const formatTimer = (seconds) => {
    return `0:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  const formatTimeLeft = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}ч ${minutes}м`;
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp(['', '', '', '']);
    setErrors({});
    setMessage('');
    setResendTimer(0);
    setResendAttempts(0);
  };

  return (
    <div className={`${styles.authContainer} ${darkMode ? styles.darkMode : ''}`}>
      <div className={styles.formContainer}>
        {step === 'otp' && (
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBackToEmail}
            aria-label="Вернуться к вводу email"
          >
            <img src={arrowLeft} alt="Назад" className={styles.backIcon} />
          </button>
        )}
        <h2 className={styles.title}>
          {step === 'email' ? 'Вход или регистрация' : step === 'otp' ? 'Введите код из письма' : 'Введите ваше имя'}
        </h2>

        {step === 'email' && (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleEmailSubmit)}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            />
            {errors.email && <p className={styles.errorText}>{errors.email}</p>}
            <label className={styles.rememberMe}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.rememberCheckbox}
              />
              <span className={styles.rememberText}>Запомнить</span>
            </label>
            <button onClick={handleEmailSubmit} className={styles.submitButton} disabled={loading}>
              {loading ? <Spinner darkMode={darkMode} isButton={true} /> : 'Получить код'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className={styles.otpEmail}>Отправлен на {email}</p>
            <p className={styles.otpSpamHint}>Если во входящих нет, проверьте спам</p>
            <div className={styles.otpInputContainer}>
              <div className={styles.otpInputWrapper}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type={showOtp ? 'tel' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={digit}
                    onChange={(e) => handleOtpInput(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className={`${styles.otpInput} ${isTestAccount ? styles.testOtpInput : ''}`}
                    maxLength={1}
                    ref={(el) => (otpRefs.current[index] = el)}
                  />
                ))}
              </div>
              <button
                type="button"
                className={styles.toggleButton}
                onClick={toggleOtpVisibility}
                aria-label={showOtp ? 'Скрыть код' : 'Показать код'}
              >
                <img src={showOtp ? showIcon : hideIcon} alt="" className={styles.toggleIcon} />
              </button>
            </div>
            {resendTimer > 0 ? (
              <p className={styles.resendText}>Отправить код повторно через {formatTimer(resendTimer)}</p>
            ) : (
              <button onClick={handleResendCode} className={styles.resendButton} disabled={loading}>
                Отправить код
              </button>
            )}
            <button onClick={handleOtpSubmit} className={styles.submitButton} disabled={loading}>
              {loading ? <Spinner darkMode={darkMode} isButton={true} /> : 'Войти'}
            </button>
          </>
        )}

        {step === 'name' && (
          <>
            <input
              type="text"
              placeholder="Имя"
              value={name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleNameSubmit)}
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            />
            {errors.name && <p className={styles.errorText}>{errors.name}</p>}
            <button onClick={handleNameSubmit} className={styles.submitButton} disabled={loading}>
              {loading ? <Spinner darkMode={darkMode} isButton={true} /> : 'Завершить регистрацию'}
            </button>
          </>
        )}

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
  );
};

export default Auth;