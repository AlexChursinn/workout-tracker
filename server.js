const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();

// Путь к db.json
const dbFile = fs.existsSync('/persistent') ? '/persistent/db.json' : path.join(__dirname, 'db.json');

// Инициализация db.json
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ users: [] }, null, 2));
  console.log(`Создан новый файл db.json по пути: ${dbFile}`);
}

// Настройка CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://workout-tracker-beta-rose.vercel.app',
  'https://workout-tracker-64ux.onrender.com',
  'https://web.telegram.org',
  'https://t.me',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS отклонён для origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Секреты
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'default_access_secret_key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret_key';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7260346507:AAHgyipsw-rCJHvOzsqXQgZgHRkJkMjMI90';

// Хранилище OTP
const otpStorage = new Map();

// Чтение и запись в db.json
const readDatabase = () => {
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка чтения db.json:', error.message);
    return { users: [] };
  }
};

const writeDatabase = (data) => {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
    console.log('База данных обновлена');
  } catch (error) {
    console.error('Ошибка записи db.json:', error.message);
    throw error;
  }
};

// Middleware для JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log(`Токен отсутствует в запросе: ${req.path}`);
    return res.status(401).json({ message: 'Токен отсутствует' });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(`Ошибка проверки токена: ${error.message}`);
    return res.status(403).json({ message: 'Неверный токен' });
  }
};

// Проверка Telegram
const verifyTelegramData = (data) => {
  const secret = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
  const dataCheckString = Object.keys(data)
    .filter((key) => key !== 'hash')
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n');
  const computedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  return computedHash === data.hash;
};

// Эндпоинт для отправки OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    console.log(`Некорректный email: ${email}`);
    return res.status(400).json({ message: 'Введите корректный email' });
  }

  if (!otp) {
    console.log(`OTP не предоставлен для ${email}`);
    return res.status(400).json({ message: 'OTP обязателен' });
  }

  const db = readDatabase();
  const isNewUser = !db.users.some((user) => user.email === email);

  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 минут
  otpStorage.set(email, { otp, expiresAt });
  console.log(`Сохранен OTP для ${email}: ${otp}, истекает: ${new Date(expiresAt).toISOString()}`);

  res.json({ isNewUser });
});

// Эндпоинт для проверки OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    console.log('Отсутствует email или OTP');
    return res.status(400).json({ message: 'Email и OTP-код обязательны' });
  }

  const storedOtp = otpStorage.get(email);

  if (!storedOtp) {
    console.log(`OTP не найден для ${email}`);
    return res.status(400).json({ message: 'OTP-код не найден или истек' });
  }

  if (storedOtp.expiresAt < Date.now()) {
    otpStorage.delete(email);
    console.log(`OTP истек для ${email}`);
    return res.status(400).json({ message: 'OTP-код истек' });
  }

  if (storedOtp.otp !== otp) {
    console.log(`Неверный OTP для ${email}: введено ${otp}, ожидалось ${storedOtp.otp}`);
    return res.status(400).json({ message: 'Неверный OTP-код' });
  }

  otpStorage.delete(email);
  console.log(`OTP успешно подтвержден для ${email}`);

  const db = readDatabase();
  const user = db.users.find((u) => u.email === email);

  if (user) {
    const accessToken = jwt.sign({ id: user.id, email: user.email }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id, email: user.email }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    console.log(`Вход успешен для пользователя ${email}`);
    res.json({ accessToken });
  } else {
    console.log(`Новый пользователь ${email}, ожидается завершение регистрации`);
    res.json({ message: 'OTP подтвержден, укажите имя' });
  }
});

// Остальные эндпоинты остаются без изменений
app.post('/api/auth/complete-registration', async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name || name.length < 2) {
    console.log(`Некорректные данные регистрации: email=${email}, name=${name}`);
    return res.status(400).json({ message: 'Email и имя (минимум 2 символа) обязательны' });
  }

  const db = readDatabase();
  if (db.users.some((user) => user.email === email)) {
    console.log(`Пользователь с email ${email} уже существует`);
    return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
  }

  try {
    const newUser = {
      id: Date.now(),
      name,
      email,
      passwordHash: null,
      workouts: [],
      customMuscleGroups: {},
    };
    db.users.push(newUser);
    writeDatabase(db);

    const accessToken = jwt.sign({ id: newUser.id, email: newUser.email }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: newUser.id, email: newUser.email }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    console.log(`Регистрация успешна для ${email}`);
    res.status(201).json({ message: 'Регистрация успешна', accessToken });
  } catch (error) {
    console.error(`Ошибка регистрации ${email}: ${error.message}`);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Telegram-авторизация
app.post('/api/telegram-auth', async (req, res) => {
  const telegramData = req.body;

  if (!telegramData || !telegramData.id || !telegramData.hash) {
    console.log('Некорректные данные Telegram');
    return res.status(400).json({ message: 'Некорректные данные Telegram' });
  }

  if (!verifyTelegramData(telegramData)) {
    console.log('Неверная подпись Telegram');
    return res.status(401).json({ message: 'Неверная подпись Telegram' });
  }

  const db = readDatabase();
  let user = db.users.find((u) => u.telegramId === telegramData.id);

  if (!user) {
    const newUser = {
      id: Date.now(),
      name: telegramData.first_name || 'Telegram User',
      email: `telegram_${telegramData.id}@example.com`,
      passwordHash: null,
      telegramId: telegramData.id,
      workouts: [],
      customMuscleGroups: {},
    };
    db.users.push(newUser);
    user = newUser;
    writeDatabase(db);
    console.log(`Создан новый Telegram-пользователь: ${newUser.email}`);
  }

  const accessToken = jwt.sign({ id: user.id, email: user.email }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ id: user.id, email: user.email }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  console.log(`Telegram-авторизация успешна для ${user.email}`);
  res.json({ accessToken });
});

// Обновление токена
app.post('/api/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  console.log(`Получен refresh-токен: ${refreshToken ? 'Присутствует' : 'Отсутствует'}`);

  if (!refreshToken) {
    console.log('Refresh-токен отсутствует');
    return res.status(401).json({ message: 'Refresh-токен отсутствует' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const db = readDatabase();
    const user = db.users.find((u) => u.id === decoded.id);

    if (!user) {
      console.log(`Пользователь не найден для ID: ${decoded.id}`);
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const newAccessToken = jwt.sign({ id: user.id, email: user.email }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    const newRefreshToken = jwt.sign({ id: user.id, email: user.email }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    console.log(`Токен обновлен для ${user.email}`);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error(`Ошибка обновления токена: ${error.message}`);
    res.status(403).json({ message: 'Неверный refresh-токен' });
  }
});

// Выход
app.post('/api/logout', (req, res) => {
  console.log('Запрос на выход');
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
    expires: new Date(0),
  });
  res.json({ message: 'Выход успешен' });
});

// Получение информации о пользователе
app.get('/api/user-info', authenticateToken, (req, res) => {
  const db = readDatabase();
  const user = db.users.find((u) => u.id === req.user.id);

  if (!user) {
    console.log(`Пользователь не найден для ID: ${req.user.id}`);
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  res.json({ name: user.name, email: user.email });
});

// Получение тренировок
app.get('/api/user-workouts', authenticateToken, (req, res) => {
  const db = readDatabase();
  const user = db.users.find((u) => u.id === req.user.id);

  if (!user) {
    console.log(`Пользователь не найден для ID: ${req.user.id}`);
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  res.json({ workouts: user.workouts || [] });
});

// Добавление/обновление тренировки
app.post('/api/user-workouts', authenticateToken, (req, res) => {
  const { workout_date, workoutId, exercises, title, bodyWeight, notes } = req.body;

  if (!workout_date || !workoutId || !Array.isArray(exercises)) {
    console.log('Некорректные данные тренировки');
    return res.status(400).json({ message: 'Некорректные данные тренировки' });
  }

  const db = readDatabase();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    console.log(`Пользователь не найден для ID: ${req.user.id}`);
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  const user = db.users[userIndex];
  const existingWorkoutIndex = user.workouts.findIndex(
    (w) => w.workout_date === workout_date && w.workoutId === workoutId
  );

  const newWorkout = {
    id: existingWorkoutIndex !== -1 ? user.workouts[existingWorkoutIndex].id : Date.now(),
    workoutId,
    workout_date,
    title: title || '',
    exercises,
    bodyWeight: bodyWeight || null,
    notes: notes || '',
  };

  if (existingWorkoutIndex !== -1) {
    user.workouts[existingWorkoutIndex] = newWorkout;
  } else {
    user.workouts.push(newWorkout);
  }

  try {
    writeDatabase(db);
    console.log(`Тренировка сохранена для ${user.email}, workoutId: ${workoutId}`);
    res.status(201).json({ workouts: user.workouts });
  } catch (error) {
    console.error(`Ошибка сохранения тренировки: ${error.message}`);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление тренировки
app.delete('/api/user-workouts/:workoutId', authenticateToken, (req, res) => {
  const { workoutId } = req.params;
  const { workout_date } = req.query;

  if (!workoutId || !workout_date) {
    console.log('Отсутствует workoutId или workout_date');
    return res.status(400).json({ message: 'workoutId и workout_date обязательны' });
  }

  const db = readDatabase();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    console.log(`Пользователь не найден для ID: ${req.user.id}`);
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  const user = db.users[userIndex];
  const workoutIndex = user.workouts.findIndex(
    (w) => w.workout_date === workout_date && w.workoutId === parseInt(workoutId)
  );

  if (workoutIndex === -1) {
    console.log(`Тренировка не найдена: workoutId=${workoutId}, date=${workout_date}`);
    return res.status(404).json({ message: 'Тренировка не найдена' });
  }

  user.workouts.splice(workoutIndex, 1);

  const workoutsForDate = user.workouts.filter((w) => w.workout_date === workout_date);
  workoutsForDate.forEach((workout, index) => {
    workout.workoutId = index + 1;
  });

  try {
    writeDatabase(db);
    console.log(`Тренировка удалена: workoutId=${workoutId}, date=${workout_date}`);
    res.json({ workouts: user.workouts });
  } catch (error) {
    console.error(`Ошибка удаления тренировки: ${error.message}`);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Копирование тренировки
app.post('/api/user-workouts/copy', authenticateToken, (req, res) => {
  const { source_workout_date, source_workoutId, target_workout_date } = req.body;

  if (!source_workout_date || !source_workoutId || !target_workout_date) {
    console.log('Отсутствуют данные для копирования тренировки');
    return res.status(400).json({ message: 'source_workout_date, source_workoutId и target_workout_date обязательны' });
  }

  const db = readDatabase();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    console.log(`Пользователь не найден для ID: ${req.user.id}`);
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  const user = db.users[userIndex];
  const sourceWorkout = user.workouts.find(
    (w) => w.workout_date === source_workout_date && w.workoutId === source_workoutId
  );

  if (!sourceWorkout) {
    console.log(`Исходная тренировка не найдена: workoutId=${source_workoutId}, date=${source_workout_date}`);
    return res.status(404).json({ message: 'Исходная тренировка не найдена' });
  }

  const workoutsForTargetDate = user.workouts.filter((w) => w.workout_date === target_workout_date);
  const newWorkoutId = workoutsForTargetDate.length + 1;

  const newWorkout = {
    id: Date.now(),
    workoutId: newWorkoutId,
    workout_date: target_workout_date,
    title: sourceWorkout.title || '',
    exercises: sourceWorkout.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({ ...set })),
    })),
    bodyWeight: sourceWorkout.bodyWeight || null,
    notes: sourceWorkout.notes || '',
  };

  user.workouts.push(newWorkout);

  try {
    writeDatabase(db);
    console.log(`Тренировка скопирована: sourceId=${source_workoutId} -> targetId=${newWorkoutId}`);
    res.status(201).json({ workouts: user.workouts });
  } catch (error) {
    console.error(`Ошибка копирования тренировки: ${error.message}`);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение групп мышц
app.get('/api/user-muscle-groups', authenticateToken, (req, res) => {
  const db = readDatabase();
  const user = db.users.find((u) => u.id === req.user.id);

  if (!user) {
    console.log(`Пользователь не найден для ID: ${req.user.id}`);
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  res.json({ muscleGroups: user.customMuscleGroups || {} });
});

// Сохранение групп мышц
app.post('/api/user-muscle-groups', authenticateToken, (req, res) => {
  const { muscleGroups } = req.body;

  if (!muscleGroups || typeof muscleGroups !== 'object') {
    console.log('Некорректные данные групп мышц');
    return res.status(400).json({ message: 'Некорректные данные групп мышц' });
  }

  const db = readDatabase();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    console.log(`Пользователь не найден для ID: ${req.user.id}`);
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  db.users[userIndex].customMuscleGroups = muscleGroups;

  try {
    writeDatabase(db);
    console.log(`Группы мышц сохранены для пользователя ID: ${req.user.id}`);
    res.status(201).json({ muscleGroups });
  } catch (error) {
    console.error(`Ошибка сохранения групп мышц: ${error.message}`);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});