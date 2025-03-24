const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
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
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';

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
    return res.status(401).json({ message: 'Токен отсутствует' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Ошибка проверки токена:', error);
    return res.status(403).json({ message: 'Неверный токен' });
  }
};

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

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, SECRET_KEY, { expiresIn: '1h' });
    res.status(201).json({ message: 'Регистрация успешна', token });
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

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Ошибка авторизации пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
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
  const { workout_date, workoutId, exercises, title } = req.body;

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
    title: title || '', // Оставляем title опциональным, как было раньше
    exercises,
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

app.post('/api/refresh-token', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Токен отсутствует' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const newToken = jwt.sign({ id: decoded.id, email: decoded.email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ accessToken: newToken });
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error);
    res.status(403).json({ message: 'Неверный токен' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 