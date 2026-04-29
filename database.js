// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs'); // Добавляем для хеширования пароля админа

// Путь к файлу базы данных
const dbPath = path.join(__dirname, 'tool_rental.db');

// Подключение к базе данных
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Ошибка подключения к БД:', err.message);
    } else {
        console.log('✅ Подключение к SQLite установлено');
        createTables();
    }
});

// Создание таблиц
function createTables() {
    // Таблица инструментов
    db.run(`CREATE TABLE IF NOT EXISTS tools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        image TEXT,
        status TEXT DEFAULT 'available',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы tools:', err);
        } else {
            console.log('✅ Таблица tools готова');
            addDemoData();
        }
    });

    // Таблица пользователей
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('❌ Ошибка создания таблицы users:', err);
        } else {
            console.log('✅ Таблица users готова');
            // Создаем тестового админа после создания таблицы
            createTestAdmin();
        }
    });
}

// Добавление демо данных для инструментов
function addDemoData() {
    // Проверяем, есть ли уже данные
    db.get("SELECT COUNT(*) as count FROM tools", (err, row) => {
        if (err) {
            console.error('Ошибка проверки данных:', err);
            return;
        }
        
        if (row.count === 0) {
            console.log('📝 Добавляем демо данные инструментов...');
            
            const tools = [
                ['Болгарка (УШМ)', 'Углошлифовальная машина для резки и шлифовки металла, камня. Мощность 1500 Вт, диск 125 мм.', 600, '/images/tools/bolgarka.jpeg', 'available'],
                ['Электрогенератор', 'Бензиновый генератор 3.5 кВт для автономного электропитания. Запас топлива на 8 часов работы.', 1200, '/images/tools/generator.jpeg', 'available'],
                ['Циркулярная пила', 'Мощная пила для точной продольной и поперечной резки. Мощность 1800 Вт, диск 210 мм.', 750, '/images/tools/pila.jpeg', 'rented'],
                ['Сабельная пила', 'Электропила для сложных резов в труднодоступных местах. Регулируемая скорость до 3000 об/мин.', 550, '/images/tools/pila1.jpeg', 'available'],
                ['Пуско-зарядное устройство', 'Для запуска автомобиля при разряженном аккумуляторе. Пиковый ток 1500А, встроенный компрессор.', 400, '/images/tools/prikurivatel.jpeg', 'available'],
                ['Дрель ударная', 'Профессиональная дрель с функцией удара для бетона и кирпича. Мощность 850 Вт, 2 скорости.', 500, '/images/tools/drel.jpg', 'available'],
                ['Перфоратор SDS-Plus', 'Мощный перфоратор для долбления бетона и кирпича. Энергия удара 3.5 Дж, режимы сверления/долбления.', 900, '/images/tools/sverlo.jpg', 'available'],
                ['Виброплита', 'Профессиональная виброплита для уплотнения грунта и асфальта. Глубина уплотнения до 30 см.', 1800, '/images/tools/vibroplita1.jpg', 'available']
            ];

            const insert = db.prepare("INSERT INTO tools (name, description, price, image, status) VALUES (?, ?, ?, ?, ?)");
            
            tools.forEach(tool => {
                insert.run(tool, (err) => {
                    if (err) {
                        console.error('Ошибка добавления инструмента:', err);
                    }
                });
            });
            
            insert.finalize();
            console.log('✅ Демо данные инструментов добавлены');
        } else {
            console.log('✅ Данные инструментов уже есть в базе');
        }
    });
}

// Функция для создания тестового админа
function createTestAdmin() {
    db.get("SELECT * FROM users WHERE email = 'admin@example.com'", (err, user) => {
        if (err) {
            console.error('❌ Ошибка проверки админа:', err);
            return;
        }
        
        if (!user) {
            console.log('👤 Создание тестового администратора...');
            const adminPassword = bcrypt.hashSync('admin123', 10);
            db.run(
                "INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)",
                ['Администратор', 'admin@example.com', adminPassword, 1],
                function(err) {
                    if (err) {
                        console.error('❌ Ошибка создания админа:', err);
                    } else {
                        console.log('✅ Тестовый админ создан: admin@example.com / admin123');
                        console.log(`   ID администратора: ${this.lastID}`);
                    }
                }
            );
        } else {
            console.log('✅ Тестовый админ уже существует');
        }
    });
}

// ==================== ФУНКЦИИ ДЛЯ РАБОТЫ С ИНСТРУМЕНТАМИ ====================

// Функция для получения всех инструментов
function getAllTools(callback) {
    db.all("SELECT * FROM tools ORDER BY id", callback);
}

// Функция для поиска инструментов
function searchTools(query, callback) {
    const searchTerm = `%${query}%`;
    db.all(
        "SELECT * FROM tools WHERE name LIKE ? OR description LIKE ? ORDER BY id",
        [searchTerm, searchTerm],
        callback
    );
}

// Функция для добавления нового инструмента
function addTool(toolData, callback) {
    const { name, description, price, image, status } = toolData;
    const sql = `INSERT INTO tools (name, description, price, image, status) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [name, description, price, image, status || 'available'], function(err) {
        callback(err, this.lastID);
    });
}

// Функция для обновления инструмента
function updateTool(id, toolData, callback) {
    const { name, description, price, image, status } = toolData;
    const sql = `UPDATE tools 
                 SET name = ?, description = ?, price = ?, image = ?, status = ? 
                 WHERE id = ?`;
    
    db.run(sql, [name, description, price, image, status, id], function(err) {
        callback(err, this.changes);
    });
}

// Функция для удаления инструмента
function deleteTool(id, callback) {
    const sql = "DELETE FROM tools WHERE id = ?";
    
    db.run(sql, [id], function(err) {
        callback(err, this.changes);
    });
}

// Функция для получения инструмента по ID
function getToolById(id, callback) {
    const sql = "SELECT * FROM tools WHERE id = ?";
    
    db.get(sql, [id], callback);
}

// ==================== ФУНКЦИИ ДЛЯ РАБОТЫ С ПОЛЬЗОВАТЕЛЯМИ ====================

// Функция для создания нового пользователя
function createUser(userData, callback) {
    const { name, email, password, phone, address } = userData;
    const sql = `INSERT INTO users (name, email, password, phone, address) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [name, email, password, phone, address], function(err) {
        callback(err, this.lastID);
    });
}

// Функция для поиска пользователя по email
function findUserByEmail(email, callback) {
    db.get("SELECT * FROM users WHERE email = ?", [email], callback);
}

// Функция для поиска пользователя по ID (без пароля)
function findUserById(id, callback) {
    db.get("SELECT id, name, email, phone, address, is_admin, created_at FROM users WHERE id = ?", [id], callback);
}

// Функция для обновления профиля пользователя
function updateUser(id, userData, callback) {
    const { name, phone, address } = userData;
    const sql = `UPDATE users 
                 SET name = ?, phone = ?, address = ? 
                 WHERE id = ?`;
    
    db.run(sql, [name, phone, address, id], function(err) {
        callback(err, this.changes);
    });
}

// Функция для смены пароля
function updateUserPassword(id, newPassword, callback) {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const sql = `UPDATE users SET password = ? WHERE id = ?`;
    
    db.run(sql, [hashedPassword, id], function(err) {
        callback(err, this.changes);
    });
}

// Функция для получения всех пользователей (только для админа)
function getAllUsers(callback) {
    db.all("SELECT id, name, email, phone, address, is_admin, created_at FROM users ORDER BY id", callback);
}

// Функция для удаления пользователя (только для админа)
function deleteUser(id, callback) {
    const sql = "DELETE FROM users WHERE id = ?";
    
    db.run(sql, [id], function(err) {
        callback(err, this.changes);
    });
}

// ==================== ЭКСПОРТ ВСЕХ ФУНКЦИЙ ====================

module.exports = {
    // Основные функции БД
    db,
    
    // Функции для инструментов
    getAllTools,
    searchTools,
    addTool,
    updateTool,
    deleteTool,
    getToolById,
    
    // Функции для пользователей
    createUser,
    findUserByEmail,
    findUserById,
    updateUser,
    updateUserPassword,
    getAllUsers,
    deleteUser
};