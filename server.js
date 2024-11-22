const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();

// Определение пути к файлу базы данных
const dbFile = fs.existsSync('/persistent') ? '/persistent/db.json' : path.join(__dirname, 'db.json');

// Проверка существования файла базы данных и его создание, если он отсутствует
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
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// Использование переменной окружения SECRET_KEY
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';

// Функция чтения базы данных
const readDatabase = () => {
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка при чтении базы данных:', error);
    return { users: [] };
  }
};

// Функция записи базы данных
const writeDatabase = (data) => {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
    console.log('База данных успешно обновлена.');
  } catch (error) {
    console.error('Ошибка при записи базы данных:', error);
    throw error;
  }
};

// Middleware для проверки токена
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

// Регистрация пользователя
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
    const newUser = { id: Date.now(), name, email, passwordHash, workouts: [] };
    db.users.push(newUser);
    writeDatabase(db);
    res.status(201).json({ message: 'Регистрация успешна' });
  } catch (error) {
    console.error('Ошибка регистрации пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Авторизация пользователя
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

// Получение данных о тренировках пользователя
app.get('/api/user-workouts', authenticateToken, (req, res) => {
  const db = readDatabase();
  const user = db.users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  res.json({ workouts: user.workouts });
});

// Добавление тренировки для пользователя
app.post('/api/user-workouts', authenticateToken, (req, res) => {
  const { workout_date, exercises } = req.body;

  if (!workout_date || !Array.isArray(exercises)) {
    return res.status(400).json({ message: 'Некорректные данные тренировки' });
  }

  const db = readDatabase();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    console.error('Пользователь не найден:', req.user);
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  const newWorkout = {
    id: Date.now(),
    workout_date,
    exercises,
  };

  db.users[userIndex].workouts.push(newWorkout);

  try {
    writeDatabase(db);
    console.log(`Тренировка добавлена для пользователя ${db.users[userIndex].email}`);
    res.status(201).json({ workouts: db.users[userIndex].workouts });
  } catch (error) {
    console.error('Ошибка при сохранении тренировки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
 