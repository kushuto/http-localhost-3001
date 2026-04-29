// server.js
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { 
    getAllTools, 
    searchTools, 
    addTool, 
    updateTool, 
    deleteTool, 
    getToolById,
    createUser,
    findUserByEmail,
    findUserById,
    updateUser,
    updateUserPassword,
    getAllUsers,
    deleteUser
} = require('./database');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key-change-this-in-production'; // В продакшене использовать .env!

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'session-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // true для HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));
app.use(express.static(path.join(__dirname, 'public')));

// ==================== АВТОРИЗАЦИЯ ====================

// Регистрация нового пользователя
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        
        // Валидация
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Необходимо указать имя, email и пароль' 
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                error: 'Пароль должен быть не менее 6 символов' 
            });
        }
        
        // Проверка, существует ли пользователь
        findUserByEmail(email, async (err, existingUser) => {
            if (err) {
                console.error('Ошибка проверки пользователя:', err);
                return res.status(500).json({ success: false, error: 'Ошибка сервера' });
            }
            
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Пользователь с таким email уже существует' 
                });
            }
            
            // Хеширование пароля
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Создание пользователя
            createUser({
                name,
                email,
                password: hashedPassword,
                phone,
                address
            }, (err, userId) => {
                if (err) {
                    console.error('Ошибка создания пользователя:', err);
                    return res.status(500).json({ success: false, error: 'Ошибка создания пользователя' });
                }
                
                // Создаем JWT токен
                const token = jwt.sign(
                    { id: userId, email, isAdmin: false },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                // Устанавливаем куки
                res.cookie('token', token, {
                    maxAge: 24 * 60 * 60 * 1000,
                    httpOnly: true
                });
                
                req.session.userId = userId;
                
                res.json({
                    success: true,
                    message: 'Регистрация успешна',
                    user: {
                        id: userId,
                        name,
                        email,
                        phone,
                        address,
                        isAdmin: false
                    }
                });
            });
        });
        
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

// Вход в систему
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Необходимо указать email и пароль' 
            });
        }
        
        findUserByEmail(email, async (err, user) => {
            if (err) {
                console.error('Ошибка поиска пользователя:', err);
                return res.status(500).json({ success: false, error: 'Ошибка сервера' });
            }
            
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Неверный email или пароль' 
                });
            }
            
            // Проверка пароля
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Неверный email или пароль' 
                });
            }
            
            // Создаем JWT токен
            const token = jwt.sign(
                { id: user.id, email: user.email, isAdmin: user.is_admin === 1 },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            // Устанавливаем куки
            res.cookie('token', token, {
                maxAge: 24 * 60 * 60 * 1000,
                httpOnly: true
            });
            
            req.session.userId = user.id;
            
            res.json({
                success: true,
                message: 'Вход выполнен успешно',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    address: user.address,
                    isAdmin: user.is_admin === 1
                }
            });
        });
        
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

// Выход из системы
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    req.session.destroy();
    res.json({ success: true, message: 'Выход выполнен успешно' });
});

// Получение информации о текущем пользователе
app.get('/api/auth/me', (req, res) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'Не авторизован' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        findUserById(decoded.id, (err, user) => {
            if (err || !user) {
                return res.status(401).json({ success: false, error: 'Пользователь не найден' });
            }
            
            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    address: user.address,
                    isAdmin: user.is_admin === 1
                }
            });
        });
        
    } catch (error) {
        res.status(401).json({ success: false, error: 'Недействительный токен' });
    }
});

// Обновление профиля пользователя
app.put('/api/user/profile', requireAuth, (req, res) => {
    const { name, phone, address } = req.body;
    
    updateUser(req.userId, { name, phone, address }, (err, changes) => {
        if (err) {
            console.error('Ошибка обновления профиля:', err);
            return res.status(500).json({ success: false, error: 'Ошибка обновления профиля' });
        }
        
        res.json({
            success: true,
            message: 'Профиль успешно обновлен'
        });
    });
});

// Смена пароля
app.put('/api/user/password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'Необходимо указать текущий и новый пароль' });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'Новый пароль должен быть не менее 6 символов' });
    }
    
    findUserById(req.userId, async (err, user) => {
        if (err || !user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        
        // Проверяем текущий пароль (нужно получить его из БД)
        findUserByEmail(user.email, async (err, fullUser) => {
            if (err || !fullUser) {
                return res.status(500).json({ success: false, error: 'Ошибка проверки пароля' });
            }
            
            const isValidPassword = await bcrypt.compare(currentPassword, fullUser.password);
            
            if (!isValidPassword) {
                return res.status(401).json({ success: false, error: 'Неверный текущий пароль' });
            }
            
            // Обновляем пароль
            updateUserPassword(req.userId, newPassword, (err, changes) => {
                if (err) {
                    return res.status(500).json({ success: false, error: 'Ошибка смены пароля' });
                }
                
                res.json({ success: true, message: 'Пароль успешно изменен' });
            });
        });
    });
});

// ==================== MIDDLEWARE ДЛЯ ПРОВЕРКИ АВТОРИЗАЦИИ ====================

// Проверка авторизации для API
function requireAuth(req, res, next) {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'Требуется авторизация' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        req.isAdmin = decoded.isAdmin;
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: 'Недействительный токен' });
    }
}

// Проверка прав администратора
function requireAdmin(req, res, next) {
    if (!req.isAdmin) {
        return res.status(403).json({ success: false, error: 'Доступ запрещен. Требуются права администратора' });
    }
    next();
}

// ==================== АДМИН-ПАНЕЛЬ (ЗАЩИЩЕННЫЕ МАРШРУТЫ) ====================

// Получение всех пользователей (только для админа)
app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
    getAllUsers((err, users) => {
        if (err) {
            console.error('Ошибка получения пользователей:', err);
            return res.status(500).json({ success: false, error: 'Ошибка получения пользователей' });
        }
        res.json({ success: true, users });
    });
});

// Удаление пользователя (только для админа)
app.delete('/api/admin/users/:id', requireAuth, requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    
    deleteUser(id, (err, changes) => {
        if (err) {
            console.error('Ошибка удаления пользователя:', err);
            return res.status(500).json({ success: false, error: 'Ошибка удаления пользователя' });
        }
        
        if (changes === 0) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        
        res.json({ success: true, message: 'Пользователь удален' });
    });
});

// ==================== API ДЛЯ РАБОТЫ С ИНСТРУМЕНТАМИ (с защитой для админа) ====================

// Получить все инструменты (публичный доступ)
app.get('/api/tools', (req, res) => {
    getAllTools((err, tools) => {
        if (err) {
            console.error('❌ Ошибка получения инструментов:', err);
            res.status(500).json({ error: 'Ошибка базы данных' });
            return;
        }
        console.log('📦 Отправлено инструментов:', tools.length);
        res.json(tools);
    });
});

// Получить инструмент по ID (публичный доступ)
app.get('/api/tools/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    getToolById(id, (err, tool) => {
        if (err) {
            console.error('❌ Ошибка получения инструмента:', err);
            res.status(500).json({ error: 'Ошибка базы данных' });
            return;
        }
        
        if (!tool) {
            res.status(404).json({ error: 'Инструмент не найден' });
            return;
        }
        
        res.json(tool);
    });
});

// Поиск инструментов (публичный доступ)
app.get('/api/tools/search', (req, res) => {
    const query = req.query.q;
    if (!query) {
        res.status(400).json({ error: 'Не указан поисковый запрос' });
        return;
    }

    searchTools(query, (err, tools) => {
        if (err) {
            console.error('❌ Ошибка поиска инструментов:', err);
            res.status(500).json({ error: 'Ошибка базы данных' });
            return;
        }
        res.json(tools);
    });
});

// Добавить новый инструмент (только для админа)
app.post('/api/tools', requireAuth, requireAdmin, (req, res) => {
    const { name, description, price, image, status } = req.body;
    
    if (!name || !description || !price) {
        res.status(400).json({ error: 'Необходимо указать название, описание и цену' });
        return;
    }
    
    addTool({ name, description, price, image, status }, (err, toolId) => {
        if (err) {
            console.error('❌ Ошибка добавления инструмента:', err);
            res.status(500).json({ error: 'Ошибка базы данных' });
            return;
        }
        
        console.log('✅ Добавлен новый инструмент:', toolId);
        res.json({ 
            success: true, 
            message: 'Инструмент успешно добавлен',
            id: toolId 
        });
    });
});

// Обновить инструмент (только для админа)
app.put('/api/tools/:id', requireAuth, requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const { name, description, price, image, status } = req.body;
    
    if (!name || !description || !price) {
        res.status(400).json({ error: 'Необходимо указать название, описание и цену' });
        return;
    }
    
    updateTool(id, { name, description, price, image, status }, (err, changes) => {
        if (err) {
            console.error('❌ Ошибка обновления инструмента:', err);
            res.status(500).json({ error: 'Ошибка базы данных' });
            return;
        }
        
        if (changes === 0) {
            res.status(404).json({ error: 'Инструмент не найден' });
            return;
        }
        
        console.log('✅ Обновлен инструмент:', id);
        res.json({ 
            success: true, 
            message: 'Инструмент успешно обновлен',
            changes: changes 
        });
    });
});

// Удалить инструмент (только для админа)
app.delete('/api/tools/:id', requireAuth, requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    
    deleteTool(id, (err, changes) => {
        if (err) {
            console.error('❌ Ошибка удаления инструмента:', err);
            res.status(500).json({ error: 'Ошибка базы данных' });
            return;
        }
        
        if (changes === 0) {
            res.status(404).json({ error: 'Инструмент не найден' });
            return;
        }
        
        console.log('✅ Удален инструмент:', id);
        res.json({ 
            success: true, 
            message: 'Инструмент успешно удален',
            changes: changes 
        });
    });
});

// ==================== СТРАНИЦЫ ====================

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Страница админ-панели (с проверкой авторизации на клиенте)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Страница профиля пользователя
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Обработка 404
app.use((req, res) => {
    res.status(404).send('Страница не найдена');
});

// ==================== ЗАПУСК СЕРВЕРА ====================

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📊 База данных: tool_rental.db`);
    console.log(`🔗 API инструментов: http://localhost:${PORT}/api/tools`);
    console.log(`🔐 API авторизации: http://localhost:${PORT}/api/auth`);
    console.log(`👨‍💼 Админ-панель: http://localhost:${PORT}/admin`);
    console.log(`👤 Профиль: http://localhost:${PORT}/profile`);
    console.log(`✅ Система авторизации активна`);
    console.log(`🔑 Тестовый админ: admin@example.com / admin123`);
});