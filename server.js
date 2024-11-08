const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000', // Локальная разработка
    'https://workout-tracker-beta-rose.vercel.app', // URL вашего приложения на Vercel
    'https://workout-tracker-hljr.onrender.com' // URL вашего приложения на Render
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());

const SECRET_KEY = 'your_secret_key';
const dbFile = 'db.json';

// Функция чтения базы данных
const readDatabase = () => {
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
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
  } catch (error) {
    console.error('Ошибка при записи в файл базы данных:', error);
    throw error;
  }
};

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
  }

  const db = readDatabase();

  if (db.users.some(user => user.email === email)) {
    return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), name, email, passwordHash, workouts: [] };
    db.users.push(newUser);
    writeDatabase(db);
    res.status(201).json({ message: 'Регистрация успешна' });
  } catch (error) {
    console.error('Ошибка при хэшировании пароля или записи в базу данных:', error);
    res.status(500).json({ message: 'Ошибка сервера. Попробуйте позже' });
  }
});

// Авторизация пользователя
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const db = readDatabase();
  const user = db.users.find(user => user.email === email);

  if (!user) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  try {
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Создание токена с userId и email
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Ошибка при проверке пароля:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение данных о тренировках пользователя
app.get('/api/user-workouts', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Токен отсутствует' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const db = readDatabase();
    const user = db.users.find(user => user.id === decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json({ workouts: user.workouts });
  } catch (error) {
    console.error('Ошибка при проверке токена:', error);
    res.status(403).json({ message: 'Неверный токен' });
  }
});

// Добавление тренировки для пользователя
app.post('/api/user-workouts', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Токен отсутствует' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const db = readDatabase();
    const userIndex = db.users.findIndex(user => user.id === decoded.id);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const newWorkout = {
      id: Date.now(),
      workout_date: req.body.workout_date,
      exercises: req.body.exercises,
    };
    db.users[userIndex].workouts.push(newWorkout);
    writeDatabase(db);

    // Возвращаем обновленные данные для клиента
    res.status(201).json({ workouts: db.users[userIndex].workouts });
  } catch (error) {
    console.error('Ошибка при добавлении тренировки:', error);
    res.status(403).json({ message: 'Неверный токен' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
