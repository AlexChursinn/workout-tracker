const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const dbFile = fs.existsSync('/persistent') ? '/persistent/db.json' : path.join(__dirname, 'db.json');

if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ users: [] }, null, 2));
  console.log(`Создан новый файл db.json по пути: ${dbFile}`);
}

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
      console.log('CORS отклонён для origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'default_access_secret_key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret_key';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7260346507:AAHgyipsw-rCJHvOzsqXQgZgHRkJkMjMI90';

const readDatabase = () => {
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка при чтении базы данных:', error);
    return { users: [] };
  }
};

const writeDatabase = (data) => {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
    console.log('База данных успешно обновлена.');
  } catch (error) {
    console.error('Ошибка при записи базы данных:', error);
    throw error;
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('Токен отсутствует в запросе:', req.path);
    return res.status(401).json({ message: 'Токен отсутствует' });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Ошибка проверки токена:', error);
    return res.status(403).json({ message: 'Неверный токен' });
  }
};

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

app.post('/api/telegram-auth', async (req, res) => {
  const telegramData = req.body;

  if (!telegramData || !telegramData.id || !telegramData.hash) {
    return res.status(400).json({ message: 'Некорректные данные Telegram' });
  }

  if (!verifyTelegramData(telegramData)) {
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
  }

  const accessToken = jwt.sign({ id: user.id, email: user.email }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ id: user.id, email: user.email }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken });
});

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
  }

  const db = readDatabase();

  if (db.users.some((user) => user.email === email)) {
    return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), name, email, passwordHash, workouts: [], customMuscleGroups: {} };
    db.users.push(newUser);
    writeDatabase(db);

    const accessToken = jwt.sign({ id: newUser.id, email: newUser.email }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: newUser.id, email: newUser.email }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ message: 'Регистрация успешна', accessToken });
  } catch (error) {
    console.error('Ошибка регистрации пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const db = readDatabase();
  const user = db.users.find((user) => user.email === email);

  if (!user) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  try {
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const accessToken = jwt.sign({ id: user.id, email: user.email }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id, email: user.email }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (error) {
    console.error('Ошибка авторизации пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервиса' });
  }
});

app.post('/api/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  console.log('Получен refresh-токен:', refreshToken ? 'Присутствует' : 'Отсутствует');

  if (!refreshToken) {
    console.log('Refresh-токен отсутствует в запросе');
    return res.status(401).json({ message: 'Refresh-токен отсутствует' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    console.log('Refresh-токен валиден, пользователь:', decoded);
    const db = readDatabase();
    const user = db.users.find((u) => u.id === decoded.id);

    if (!user) {
      console.log('Пользователь не найден для ID:', decoded.id);
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const newAccessToken = jwt.sign({ id: user.id, email: user.email }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    const newRefreshToken = jwt.sign({ id: user.id, email: user.email }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    console.log('Новый access-токен выдан:', newAccessToken);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error);
    res.status(403).json({ message: 'Неверный refresh-токен' });
  }
});

app.post('/api/logout', (req, res) => {
  console.log('Запрос на выход, удаление refresh-токена');
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    expires: new Date(0),
  });
  res.json({ message: 'Выход успешен' });
});

app.get('/api/user-workouts', authenticateToken, (req, res) => {
  const db = readDatabase();
  const user = db.users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  res.json({ workouts: user.workouts });
});

app.post('/api/user-workouts', authenticateToken, (req, res) => {
  const { workout_date, workoutId, exercises, title, bodyWeight, notes } = req.body;

  if (!workout_date || !workoutId || !Array.isArray(exercises)) {
    return res.status(400).json({ message: 'Некорректные данные тренировки' });
  }

  const db = readDatabase();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
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
    res.status(201).json({ workouts: user.workouts });
  } catch (error) {
    console.error('Error saving workout:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.delete('/api/user-workouts/:workoutId', authenticateToken, (req, res) => {
  const { workoutId } = req.params;
  const workout_date = req.query.workout_date;

  if (!workoutId || !workout_date) {
    return res.status(400).json({ message: 'workoutId и workout_date обязательны' });
  }

  const db = readDatabase();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  const user = db.users[userIndex];
  const workoutIndex = user.workouts.findIndex(
    (w) => w.workout_date === workout_date && w.workoutId === parseInt(workoutId)
  );

  if (workoutIndex === -1) {
    console.log(`Workout not found for user ${req.user.id}: workoutId=${workoutId}, workout_date=${workout_date}`);
    console.log('Available workouts:', user.workouts.map(w => ({ workoutId: w.workoutId, workout_date: w.workout_date })));
    return res.status(404).json({ message: 'Тренировка не найдена' });
  }

  user.workouts.splice(workoutIndex, 1);

  const workoutsForDate = user.workouts.filter((w) => w.workout_date === workout_date);
  workoutsForDate.forEach((workout, index) => {
    workout.workoutId = index + 1;
  });

  try {
    writeDatabase(db);
    res.json({ workouts: user.workouts });
  } catch (error) {
    console.error('Ошибка при удалении тренировки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/user-workouts/copy', authenticateToken, (req, res) => {
  const { source_workout_date, source_workoutId, target_workout_date } = req.body;

  if (!source_workout_date || !source_workoutId || !target_workout_date) {
    return res.status(400).json({ message: 'source_workout_date, source_workoutId и target_workout_date обязательны' });
  }

  const db = readDatabase();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  const user = db.users[userIndex];
  const sourceWorkout = user.workouts.find(
    (w) => w.workout_date === source_workout_date && w.workoutId === source_workoutId
  );

  if (!sourceWorkout) {
    console.log(`Source workout not found for user ${req.user.id}: source_workoutId=${source_workoutId}, source_workout_date=${source_workout_date}`);
    console.log('Available workouts:', user.workouts.map(w => ({ workoutId: w.workoutId, workout_date: w.workout_date })));
    return res.status(404).json({ message: 'Исходная тренировка не найдена' });
  }

  const workoutsForTargetDate = user.workouts.filter((w) => w.workout_date === target_workout_date);
  const newWorkoutId = workoutsForTargetDate.length + 1;

  const newWorkout = {
    id: Date.now(),
    workoutId: newWorkoutId,
    workout_date: target_workout_date,
    title: sourceWorkout.title || '',
    exercises: sourceWorkout.exercises.map((exercise) => ({ ...exercise })),
    bodyWeight: sourceWorkout.bodyWeight || null,
    notes: sourceWorkout.notes || '',
  };

  user.workouts.push(newWorkout);

  try {
    writeDatabase(db);
    res.status(201).json({ workouts: user.workouts });
  } catch (error) {
    console.error('Ошибка при копировании тренировки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/user-muscle-groups', authenticateToken, (req, res) => {
  const db = readDatabase();
  const user = db.users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  res.json({ muscleGroups: user.customMuscleGroups || {} });
});

app.post('/api/user-muscle-groups', authenticateToken, (req, res) => {
  const { muscleGroups } = req.body;

  if (!muscleGroups || typeof muscleGroups !== 'object') {
    return res.status(400).json({ message: 'Некорректные данные групп мышц' });
  }

  const db = readDatabase();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  db.users[userIndex].customMuscleGroups = muscleGroups;

  try {
    writeDatabase(db);
    res.status(201).json({ muscleGroups });
  } catch (error) {
    console.error('Error saving custom muscle groups:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});