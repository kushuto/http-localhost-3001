// admin.js
let allTools = [];
let currentUser = null;

// ==================== ПРОВЕРКА АВТОРИЗАЦИИ ====================

// Проверка прав администратора
async function checkAdminAuth() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (!data.success || !data.user.isAdmin) {
            // Перенаправляем на главную, если не админ
            showNotification('Доступ запрещен. Требуются права администратора', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return false;
        }
        
        currentUser = data.user;
        
        // Обновляем интерфейс для админа
        updateAdminUI();
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка проверки прав:', error);
        showNotification('Ошибка проверки авторизации', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        return false;
    }
}

// Обновление интерфейса для админа
function updateAdminUI() {
    // Добавляем информацию о текущем пользователе
    const header = document.querySelector('.admin-header');
    if (header && currentUser) {
        const userInfo = document.createElement('div');
        userInfo.className = 'admin-user-info';
        userInfo.innerHTML = `
            <span class="admin-user-name">👤 ${currentUser.name}</span>
            <button class="btn btn-logout" onclick="logout()">Выйти</button>
        `;
        header.appendChild(userInfo);
    }
}

// Показ уведомлений
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-green)' : 'var(--error-red)'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 2000;
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 1rem;
        font-weight: 500;
    `;
    
    // Добавляем стили для анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }, 3000);
}

// Выход из системы
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Выход выполнен успешно');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    } catch (error) {
        console.error('❌ Ошибка выхода:', error);
        showNotification('Ошибка при выходе', 'error');
    }
}

// ==================== ЗАГРУЗКА И ОТОБРАЖЕНИЕ ИНСТРУМЕНТОВ ====================

// Загрузка инструментов
async function loadTools() {
    try {
        const response = await fetch('/api/tools');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allTools = await response.json();
        displayToolsTable();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки инструментов:', error);
        showNotification('Ошибка загрузки инструментов', 'error');
    }
}

// Отображение таблицы инструментов
function displayToolsTable() {
    const tableBody = document.getElementById('toolsTableBody');
    
    if (!tableBody) return;
    
    if (allTools.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    Нет инструментов для отображения
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = allTools.map(tool => `
        <tr>
            <td>${tool.id}</td>
            <td>${tool.name}</td>
            <td>${tool.description.substring(0, 50)}${tool.description.length > 50 ? '...' : ''}</td>
            <td>${tool.price} руб</td>
            <td>
                <span class="tool-status ${tool.status}">
                    ${tool.status === 'available' ? '✅ В наличии' : '🔄 Занято'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="editTool(${tool.id})" title="Редактировать">
                        ✏️
                    </button>
                    <button class="btn btn-danger" onclick="deleteTool(${tool.id})" title="Удалить">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ==================== УПРАВЛЕНИЕ ИНСТРУМЕНТАМИ ====================

// Открытие модального окна для добавления
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Добавить инструмент';
    document.getElementById('toolForm').reset();
    document.getElementById('toolId').value = '';
    document.getElementById('toolImage').value = '/images/tools/default.jpg';
    document.getElementById('toolModal').style.display = 'block';
}

// Редактирование инструмента
async function editTool(id) {
    try {
        const response = await fetch(`/api/tools/${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const tool = await response.json();
        
        document.getElementById('modalTitle').textContent = 'Редактировать инструмент';
        document.getElementById('toolId').value = tool.id;
        document.getElementById('toolName').value = tool.name;
        document.getElementById('toolDescription').value = tool.description;
        document.getElementById('toolPrice').value = tool.price;
        document.getElementById('toolImage').value = tool.image || '/images/tools/default.jpg';
        document.getElementById('toolStatus').value = tool.status;
        
        document.getElementById('toolModal').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Ошибка загрузки инструмента:', error);
        showNotification('Ошибка загрузки инструмента', 'error');
    }
}

// Удаление инструмента
async function deleteTool(id) {
    if (!confirm('Вы уверены, что хотите удалить этот инструмент?')) {
        return;
    }

    try {
        const response = await fetch(`/api/tools/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error);
        }
        
        showNotification('Инструмент успешно удален');
        loadTools(); // Перезагружаем список
        
    } catch (error) {
        console.error('❌ Ошибка удаления инструмента:', error);
        showNotification('Ошибка удаления инструмента: ' + error.message, 'error');
    }
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('toolModal').style.display = 'none';
}

// Обработка формы
document.getElementById('toolForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const toolData = {
        name: document.getElementById('toolName').value,
        description: document.getElementById('toolDescription').value,
        price: parseInt(document.getElementById('toolPrice').value),
        image: document.getElementById('toolImage').value || '/images/tools/default.jpg',
        status: document.getElementById('toolStatus').value
    };
    
    const toolId = document.getElementById('toolId').value;
    
    try {
        let response;
        
        if (toolId) {
            // Редактирование
            response = await fetch(`/api/tools/${toolId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(toolData)
            });
        } else {
            // Добавление
            response = await fetch('/api/tools', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(toolData)
            });
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error);
        }
        
        showNotification(toolId ? 'Инструмент успешно обновлен' : 'Инструмент успешно добавлен');
        closeModal();
        loadTools();
        
    } catch (error) {
        console.error('❌ Ошибка сохранения инструмента:', error);
        showNotification('Ошибка сохранения инструмента: ' + error.message, 'error');
    }
});

// ==================== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ====================

// Экспорт данных
function exportData() {
    const dataStr = JSON.stringify(allTools, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `tools_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Данные экспортированы');
}

// Импорт данных (новая функция)
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const tools = JSON.parse(e.target.result);
                
                if (confirm(`Импортировать ${tools.length} инструментов?`)) {
                    for (const tool of tools) {
                        await fetch('/api/tools', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(tool)
                        });
                    }
                    showNotification('Импорт завершен');
                    loadTools();
                }
            } catch (error) {
                console.error('Ошибка импорта:', error);
                showNotification('Ошибка импорта данных', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ==================== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (ДЛЯ АДМИНА) ====================

// Загрузка списка пользователей
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки пользователей');
        }
        
        const data = await response.json();
        displayUsersTable(data.users);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки пользователей:', error);
        showNotification('Ошибка загрузки пользователей', 'error');
    }
}

// Отображение таблицы пользователей
function displayUsersTable(users) {
    // Создаем модальное окно для пользователей, если его нет
    let usersModal = document.getElementById('usersModal');
    
    if (!usersModal) {
        usersModal = document.createElement('div');
        usersModal.id = 'usersModal';
        usersModal.className = 'modal';
        usersModal.innerHTML = `
            <div class="modal-content users-modal">
                <div class="modal-header">
                    <h2>👥 Управление пользователями</h2>
                    <button class="close-modal" onclick="closeUsersModal()">×</button>
                </div>
                <div class="modal-body">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Имя</th>
                                <th>Email</th>
                                <th>Телефон</th>
                                <th>Админ</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody"></tbody>
                    </table>
                </div>
            </div>
        `;
        document.body.appendChild(usersModal);
    }
    
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone || '—'}</td>
            <td>${user.is_admin ? '✅ Да' : '❌ Нет'}</td>
            <td>
                <button class="btn btn-danger btn-small" onclick="deleteUser(${user.id})">
                    🗑️ Удалить
                </button>
            </td>
        </tr>
    `).join('');
    
    usersModal.style.display = 'block';
}

// Закрытие модального окна пользователей
function closeUsersModal() {
    const modal = document.getElementById('usersModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Удаление пользователя
async function deleteUser(userId) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Пользователь удален');
            loadUsers(); // Перезагружаем список
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('❌ Ошибка удаления пользователя:', error);
        showNotification('Ошибка удаления пользователя', 'error');
    }
}

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

// Закрытие модального окна при клике вне его
window.addEventListener('click', function(e) {
    const toolModal = document.getElementById('toolModal');
    const usersModal = document.getElementById('usersModal');
    
    if (e.target === toolModal) {
        closeModal();
    }
    
    if (e.target === usersModal) {
        closeUsersModal();
    }
});

// Закрытие по Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
        closeUsersModal();
    }
});

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

// Главная функция инициализации
async function initAdmin() {
    console.log('🔄 Инициализация админ-панели...');
    
    // Проверяем права администратора
    const isAdmin = await checkAdminAuth();
    
    if (isAdmin) {
        // Загружаем инструменты
        await loadTools();
        
        // Добавляем кнопку управления пользователями
        addUsersButton();
        
        // Добавляем кнопку импорта
        addImportButton();
        
        // Добавляем статистику
        addStatistics();
    }
}

// Добавление кнопки управления пользователями
function addUsersButton() {
    const adminActions = document.querySelector('.admin-actions');
    if (adminActions && !document.querySelector('.users-btn')) {
        const usersBtn = document.createElement('button');
        usersBtn.className = 'btn btn-primary users-btn';
        usersBtn.innerHTML = '👥 Управление пользователями';
        usersBtn.onclick = loadUsers;
        adminActions.appendChild(usersBtn);
    }
}

// Добавление кнопки импорта
function addImportButton() {
    const adminActions = document.querySelector('.admin-actions');
    if (adminActions && !document.querySelector('.import-btn')) {
        const importBtn = document.createElement('button');
        importBtn.className = 'btn btn-success import-btn';
        importBtn.innerHTML = '📥 Импорт данных';
        importBtn.onclick = importData;
        adminActions.appendChild(importBtn);
    }
}

// Добавление статистики
function addStatistics() {
    const adminContainer = document.querySelector('.admin-container');
    if (!adminContainer) return;
    
    const statsDiv = document.createElement('div');
    statsDiv.className = 'admin-stats';
    statsDiv.innerHTML = `
        <div class="stats-cards">
            <div class="stat-card">
                <div class="stat-icon">🔧</div>
                <div class="stat-info">
                    <span class="stat-value">${allTools.length}</span>
                    <span class="stat-label">Всего инструментов</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-info">
                    <span class="stat-value">${allTools.filter(t => t.status === 'available').length}</span>
                    <span class="stat-label">В наличии</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🔄</div>
                <div class="stat-info">
                    <span class="stat-value">${allTools.filter(t => t.status === 'rented').length}</span>
                    <span class="stat-label">Занято</span>
                </div>
            </div>
        </div>
    `;
    
    adminContainer.insertBefore(statsDiv, adminContainer.querySelector('.admin-table'));
}

// Запуск инициализации после загрузки DOM
document.addEventListener('DOMContentLoaded', initAdmin);

//пароль и логин для admin admin@example.com\admin123