// server.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const dbFile = 'db.json';

// Функция чтения данных из файла
const readDatabase = () => {
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка при чтении файла базы данных:', error);
    return { workouts: [] };
  }
};

// Функция записи данных в файл
const writeDatabase = (data) => {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Ошибка при записи в файл базы данных:', error);
  }
};

// Получить все тренировки
app.get('/api/workouts', (req, res) => {
  const db = readDatabase();
  res.json(db.workouts);
});

// Добавить новую тренировку
app.post('/api/workouts', (req, res) => {
  const db = readDatabase();
  const newWorkout = { id: Date.now(), ...req.body };
  db.workouts.push(newWorkout);
  writeDatabase(db);
  console.log('Сохранена новая тренировка:', newWorkout); // Логируем данные тренировки
  res.status(201).json(newWorkout);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
