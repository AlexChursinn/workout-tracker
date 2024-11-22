const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
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
  'https://t.me'
];

app.use(cors({
  origin: (origin, callback) => {
    console.log(`CORS Origin: ${origin}`);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('Not allowed by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true,
}));

// Обработка preflight-запросов
app.options('*', cors());

app.use(express.json());

// Использование переменной окружения SECRET_KEY
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';

// Функция чтения базы данных
const readDatabase = () => {
  try {
    console.log('Чтение базы данных');
    const data = fs.readFileSync(dbFile, 'utf8');
    console.log('База данных успешно прочитана');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка при чтении файла базы данных:', error);
    return { users: [] };
  }
};

// Функция записи базы данных
const writeDatabase = (data) => {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
    console.log('Запись в базу данных выполнена успешно');
  } catch (error) {
    console.error('Ошибка при записи в файл базы данных:', error);
    throw error;
  }
};

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
  console.log('Получен запрос на регистрацию:', req.body);
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    console.warn('Некорректные данные при регистрации');
    return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
  }

  const db = readDatabase();

  if (db.users.some(user => user.email === email)) {
    console.warn('Пользователь с таким email уже существует:', email);
    return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), name, email, passwordHash, workouts: [] };
    db.users.push(newUser);
    writeDatabase(db);
    console.log('Регистрация пользователя выполнена успешно:', newUser);
    res.status(201).json({ message: 'Регистрация успешна' });
  } catch (error) {
    console.error('Ошибка при хэшировании пароля или записи в базу данных:', error);
    res.status(500).json({ message: 'Ошибка сервера. Попробуйте позже' });
  }
});

// Авторизация через Telegram WebApp
const validateTelegramAuth = (query) => {
  const secretKey = crypto.createHmac('sha256', SECRET_KEY).update('WebAppAuth').digest();
  const checkString = Object.keys(query)
    .filter((key) => key !== 'hash')
    .sort()
    .map((key) => `${key}=${query[key]}`)
    .join('\n');
  const hash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
  return hash === query.hash;
};

app.post('/api/telegram-auth', (req, res) => {
  const data = req.body;

  if (!validateTelegramAuth(data)) {
    return res.status(403).json({ message: 'Данные Telegram недействительны' });
  }

  const { id, first_name, last_name, username } = data;
  const db = readDatabase();

  let user = db.users.find((u) => u.telegram_id === id);

  if (!user) {
    user = {
      id: Date.now(),
      telegram_id: id,
      name: `${first_name} ${last_name || ''}`.trim(),
      username,
      workouts: [],
    };
    db.users.push(user);
    writeDatabase(db);
  }

  const token = jwt.sign({ id: user.id, telegram_id: user.telegram_id }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

// Авторизация пользователя
app.post('/api/login', async (req, res) => {
  console.log('Получен запрос на авторизацию:', req.body);
  const { email, password } = req.body;
  const db = readDatabase();
  const user = db.users.find(user => user.email === email);

  if (!user) {
    console.warn('Пользователь не найден при авторизации:', email);
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  try {
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      console.warn('Неверный пароль для пользователя:', email);
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    console.log('Авторизация пользователя успешна:', email);
    res.json({ token });
  } catch (error) {
    console.error('Ошибка при проверке пароля:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
  console.log('Проверка токена');
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('Токен отсутствует');
    return res.status(401).json({ message: 'Токен отсутствует' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    console.log('Токен проверен успешно:', decoded);
    next();
  } catch (error) {
    console.error('Ошибка при проверке токена:', error);
    return res.status(403).json({ message: 'Неверный токен' });
  }
};

// Получение данных о тренировках пользователя
app.get('/api/user-workouts', authenticateToken, (req, res) => {
  console.log('Запрос на получение тренировок пользователя');
  const db = readDatabase();
  const user = db.users.find(
    (u) => u.id === req.user.id || u.telegram_id === req.user.telegram_id
  );

  if (!user) {
    console.warn('Пользователь не найден:', req.user.id);
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  console.log('Данные о тренировках пользователя отправлены:', user.workouts);
  res.json({ workouts: user.workouts });
});

// Добавление тренировки для пользователя
app.post('/api/user-workouts', authenticateToken, (req, res) => {
  console.log('Запрос на добавление тренировки:', req.body);
  const db = readDatabase();
  const userIndex = db.users.findIndex(
    (u) => u.id === req.user.id || u.telegram_id === req.user.telegram_id
  );

  if (userIndex === -1) {
    console.warn('Пользователь не найден:', req.user.id);
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  const newWorkout = {
    id: Date.now(),
    workout_date: req.body.workout_date,
    exercises: req.body.exercises,
  };

  db.users[userIndex].workouts.push(newWorkout);
  writeDatabase(db);

  console.log('Новая тренировка добавлена:', newWorkout);
  res.status(201).json({ workouts: db.users[userIndex].workouts });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
