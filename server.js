const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./attendance.db');

// Создаем таблицы, если их нет
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        group_id INTEGER,
        FOREIGN KEY (group_id) REFERENCES groups(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        subject_id INTEGER,
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        lesson_id INTEGER,
        is_present INTEGER DEFAULT 1,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    )`);
});

// API для получения данных
app.get('/api/groups', (req, res) => {
    db.all('SELECT * FROM groups', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/students', (req, res) => {
    const groupId = req.query.groupId;
    db.all('SELECT * FROM students WHERE group_id = ?', [groupId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/lessons', (req, res) => {
    db.all('SELECT * FROM lessons', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/attendance', (req, res) => {
    const lessonId = req.query.lessonId;
    db.all('SELECT * FROM attendance WHERE lesson_id = ?', [lessonId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// API для обновления посещаемости
app.post('/api/attendance', (req, res) => {
    const { studentId, lessonId, isPresent } = req.body;
    db.run(
        'INSERT OR REPLACE INTO attendance (student_id, lesson_id, is_present) VALUES (?, ?, ?)',
        [studentId, lessonId, isPresent],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
