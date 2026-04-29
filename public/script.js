// script.js - ПОЛНЫЙ ФУНКЦИОНАЛ МАГАЗИНА, ПРОФИЛЯ, КАТАЛОГА И АВТОРИЗАЦИИ

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================

// Для магазина
let allTools = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let lastScrollTop = 0;
let cartVisible = true;

// Для профиля пользователя
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
    name: '',
    email: '',
    phone: '',
    address: '',
    orders: 0,
    discount: 0
};

let savedCards = JSON.parse(localStorage.getItem('savedCards')) || [];
let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];

// Для каталога (карусель)
let currentSlide = 0;
let catalogTools = [];
let catalogInterval = null;
let isCatalogHovered = false;

// Для авторизации
let isAuthenticated = false;
let currentUser = null;
let authMode = 'login'; // 'login' или 'register'

// ==================== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Инициализация приложения...');
    
    // Проверка авторизации
    checkAuth();
    
    // Инициализация магазина
    loadTools();
    updateCartDisplay();
    initCartScrollHide();
    
    // Инициализация профиля
    updateUserInfo();
    
    // Инициализация калькулятора
    initCalculator();
    
    // Обработчик поиска
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchTools(this.value);
        });
    }
    
    // Форматирование полей ввода
    initInputFormatters();
    
    // Плавная прокрутка к якорям
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Инициализация обработчиков форм авторизации
    initAuthForms();
    
    // Инициализация обработчиков карусели
    initCarouselHandlers();
});

// ==================== ФУНКЦИИ ДЛЯ МАГАЗИНА ====================

// Функция для кнопки поиска
function handleSearch() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchTools(searchInput.value);
    }
}

// Инициализация скрытия корзины при прокрутке
function initCartScrollHide() {
    window.addEventListener('scroll', function() {
        const cartWrapper = document.querySelector('.cart-wrapper');
        if (!cartWrapper) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Показывать/скрывать при прокрутке вниз/вверх
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Прокрутка вниз - скрыть
            if (cartVisible) {
                cartWrapper.style.transform = 'translateY(-100px)';
                cartWrapper.style.opacity = '0';
                cartVisible = false;
            }
        } else if (scrollTop < lastScrollTop) {
            // Прокрутка вверх - показать
            if (!cartVisible) {
                cartWrapper.style.transform = 'translateY(0)';
                cartWrapper.style.opacity = '1';
                cartVisible = true;
            }
        }
        
        lastScrollTop = scrollTop;
    });
}

// Загрузка инструментов из БД
async function loadTools() {
    try {
        console.log('🔄 Загрузка инструментов из базы данных...');
        const response = await fetch('/api/tools');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allTools = await response.json();
        console.log('✅ Загружено инструментов:', allTools.length);
        
        // Автоматически исправляем пути к изображениям
        allTools = allTools.map(tool => {
            if (!tool.image.includes('images/')) {
                const imageName = tool.image.split('/').pop();
                return {
                    ...tool,
                    image: `images/tools/${imageName}`
                };
            }
            return tool;
        });
        
        // Отображаем в каталоге вместо сетки
        displayCatalog(allTools);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки из БД:', error);
        displayStaticCatalog();
    }
}

// Отображение статических данных в каталоге (с новыми инструментами)
function displayStaticCatalog() {
    console.log('📝 Используем статические данные для каталога с новыми инструментами...');
    
    displayCatalog([
        {
            id: 1,
            name: "Болгарка (УШМ)",
            description: "Углошлифовальная машина для резки и шлифовки металла, камня. Мощность 1500 Вт, диск 125 мм.",
            price: 600,
            image: "images/tools/bolgarka.jpeg",
            status: "available"
        },
        {
            id: 2, 
            name: "Электрогенератор",
            description: "Бензиновый генератор 3.5 кВт для автономного электропитания. Запас топлива на 8 часов работы.",
            price: 1200,
            image: "images/tools/generator.jpeg",
            status: "available"
        },
        {
            id: 3,
            name: "Циркулярная пила",
            description: "Мощная пила для точной продольной и поперечной резки. Мощность 1800 Вт, диск 210 мм.",
            price: 750,
            image: "images/tools/pila.jpeg",
            status: "rented"
        },
        {
            id: 4,
            name: "Сабельная пила",
            description: "Электропила для сложных резов в труднодоступных местах. Регулируемая скорость до 3000 об/мин.",
            price: 550,
            image: "images/tools/pila1.jpeg",
            status: "available"
        },
        {
            id: 5,
            name: "Пуско-зарядное устройство",
            description: "Для запуска автомобиля при разряженном аккумуляторе. Пиковый ток 1500А, встроенный компрессор.",
            price: 400,
            image: "images/tools/prikurivatel.jpeg",
            status: "available"
        },
        {
            id: 6,
            name: "Дрель ударная",
            description: "Профессиональная дрель с функцией удара для бетона и кирпича. Мощность 850 Вт, 2 скорости.",
            price: 500, 
            image: "images/tools/drel.jpg",
            status: "available"
        },
        {
            id: 7,
            name: "Перфоратор SDS-Plus",
            description: "Мощный перфоратор для долбления бетона и кирпича. Энергия удара 3.5 Дж, режимы сверления/долбления.",
            price: 900,
            image: "images/tools/sverlo.jpg",
            status: "available"
        },
        {
            id: 8,
            name: "Отбойный молоток",
            description: "Профессиональный отбойный молоток для демонтажа бетонных конструкций. Мощность 1600 Вт, энергия удара 55 Дж.",
            price: 1800,
            image: "images/tools/drop.jpg",
            status: "available"
        },
        {
            id: 9,
            name: "Цепная электропила",
            description: "Профессиональная цепная электропила для распиловки древесины. Мощность 2000 Вт, длина шины 40 см.",
            price: 950,
            image: "images/tools/electropila.jpg",
            status: "available"
        },
        {
            id: 10,
            name: "Виброплита 80 кг",
            description: "Профессиональная виброплита для уплотнения грунта и асфальта. Глубина уплотнения до 30 см.",
            price: 1800,
            image: "images/tools/vibroplita1.jpg",
            status: "available"
        },
        {
            id: 11,
            name: "Штроборез",
            description: "Электрический штроборез для прорезания каналов в стенах под проводку. Мощность 2200 Вт, глубина реза до 40 мм.",
            price: 1000,
            image: "images/tools/shtroborez.jpg",
            status: "available"
        },
        {
            id: 12,
            name: "Строительный фен",
            description: "Термофен для прогрева поверхностей, снятия краски и пайки. Температура до 630°C, мощность 2000 Вт.",
            price: 700,
            image: "images/tools/fen.jpg",
            status: "available"
        }
    ]);
}

// ==================== ФУНКЦИИ КАТАЛОГА (КАРУСЕЛЬ) ====================

// Функция для перемещения карусели (вызывается из HTML)
function moveCarousel(direction) {
    console.log('Перемещение карусели, направление:', direction);
    moveSlide(direction);
}

// Основная функция перемещения слайда
function moveSlide(direction) {
    if (catalogTools.length === 0) return;
    
    currentSlide = (currentSlide + direction + catalogTools.length) % catalogTools.length;
    updateSlidePosition();
    resetAutoplay();
}

// Перейти к конкретному слайду
function goToSlide(index) {
    if (catalogTools.length === 0) return;
    
    currentSlide = Math.min(Math.max(index, 0), catalogTools.length - 1);
    updateSlidePosition();
    resetAutoplay();
}

// Обновление позиции слайда
function updateSlidePosition() {
    const track = document.getElementById('carouselTrack');
    const indicators = document.querySelectorAll('.indicator');
    
    if (!track) {
        console.error('❌ Трек карусели не найден');
        return;
    }
    
    // Обновляем позицию трека
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    console.log('Слайд обновлен:', currentSlide);
    
    // Обновляем индикаторы
    if (indicators.length > 0) {
        indicators.forEach((indicator, index) => {
            if (index === currentSlide) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
}

// Сброс автопрокрутки
function resetAutoplay() {
    if (!isCatalogHovered) {
        clearInterval(catalogInterval);
        catalogInterval = setInterval(() => {
            moveSlide(1);
        }, 4000);
    }
}

// Запуск автопрокрутки
function startCatalogAutoplay() {
    clearInterval(catalogInterval);
    if (!isCatalogHovered) {
        catalogInterval = setInterval(() => {
            moveSlide(1);
        }, 4000);
    }
    console.log('✅ Автопрокрутка запущена');
}

// Остановка автопрокрутки
function stopCatalogAutoplay() {
    clearInterval(catalogInterval);
    console.log('⏸️ Автопрокрутка остановлена');
}

// Отображение каталога
function displayCatalog(toolsArray) {
    const track = document.getElementById('carouselTrack');
    const indicators = document.getElementById('carouselIndicators');
    
    if (!track || !indicators) {
        console.error('❌ Не найдены элементы каталога');
        return;
    }
    
    catalogTools = toolsArray;
    currentSlide = 0;
    
    // Очищаем трек и индикаторы
    track.innerHTML = '';
    indicators.innerHTML = '';
    
    console.log('📊 Отображение каталога, инструментов:', toolsArray.length);
    
    // Создаем слайды
    toolsArray.forEach((tool, index) => {
        // Проверяем, есть ли товар в корзине
        const inCart = cart.find(item => item.id === tool.id);
        
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.innerHTML = `
            <div class="carousel-card">
                <div class="carousel-image">
                    <img src="${tool.image}" alt="${tool.name}" 
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/150x150/F8FAFC/94A3B8?text=Изображение'">
                </div>
                <h3>${tool.name}</h3>
                <div class="carousel-price">${tool.price} руб/сутки</div>
                <div class="carousel-status ${tool.status}">
                    ${tool.status === 'available' ? 'В наличии' : 'Занято'}
                </div>
                <button class="carousel-btn-add ${tool.status !== 'available' || inCart ? 'disabled' : ''}" 
                        ${tool.status !== 'available' || inCart ? 'disabled' : ''}
                        onclick="addToCartFromCatalog(${tool.id})">
                    ${inCart ? '✓ В корзине' : (tool.status === 'available' ? 'В корзину' : 'Недоступно')}
                </button>
            </div>
        `;
        
        track.appendChild(slide);
        
        // Создаем индикаторы
        const indicator = document.createElement('span');
        indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
        indicator.onclick = () => goToSlide(index);
        indicators.appendChild(indicator);
    });
    
    // Обновляем позицию
    updateSlidePosition();
    
    // Запускаем автопрокрутку
    startCatalogAutoplay();
}

// Инициализация обработчиков карусели
function initCarouselHandlers() {
    const catalogContainer = document.querySelector('.carousel-container');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (catalogContainer) {
        catalogContainer.addEventListener('mouseenter', () => {
            isCatalogHovered = true;
            stopCatalogAutoplay();
        });
        
        catalogContainer.addEventListener('mouseleave', () => {
            isCatalogHovered = false;
            startCatalogAutoplay();
        });
    }
    
    if (prevBtn) {
        // Удаляем старый обработчик и добавляем новый
        prevBtn.onclick = function(e) {
            e.preventDefault();
            moveCarousel(-1);
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = function(e) {
            e.preventDefault();
            moveCarousel(1);
        };
    }
    
    console.log('✅ Обработчики карусели инициализированы');
}

// Добавление в корзину из каталога
function addToCartFromCatalog(toolId) {
    const tool = allTools.find(t => t.id === toolId);
    
    if (!tool || tool.status !== 'available') {
        alert('Этот инструмент недоступен для аренды');
        return;
    }
    
    // Проверяем, есть ли уже в корзине
    const existingItem = cart.find(item => item.id === toolId);
    
    if (existingItem) {
        alert('Этот инструмент уже в корзине');
        return;
    }
    
    // Добавляем в корзину
    cart.push({
        id: tool.id,
        name: tool.name,
        price: tool.price,
        image: tool.image,
        days: 1
    });
    
    saveCart();
    animateCart();
    updateCartDisplay();
    
    // Показываем уведомление
    showNotification(`"${tool.name}" добавлен в корзину`);
    
    // Автоматически открываем корзину при первом добавлении
    if (cart.length === 1) {
        setTimeout(() => openCart(), 500);
    }
    
    // Обновляем каталог чтобы отобразить статус "В корзине"
    displayCatalog(allTools);
}

// ==================== ФУНКЦИИ КОРЗИНЫ ====================

// Добавление в корзину
function addToCart(toolId) {
    const tool = allTools.find(t => t.id === toolId);
    
    if (!tool || tool.status !== 'available') {
        alert('Этот инструмент недоступен для аренды');
        return;
    }
    
    // Проверяем, есть ли уже в корзине
    const existingItem = cart.find(item => item.id === toolId);
    
    if (existingItem) {
        alert('Этот инструмент уже в корзине');
        return;
    }
    
    // Добавляем в корзину
    cart.push({
        id: tool.id,
        name: tool.name,
        price: tool.price,
        image: tool.image,
        days: 1
    });
    
    // Сохраняем в localStorage
    saveCart();
    
    // Анимация корзины
    animateCart();
    
    // Обновляем отображение
    updateCartDisplay();
    
    // Обновляем кнопку в карточке товара
    const button = document.querySelector(`.add-to-cart-btn[onclick="addToCart(${toolId})"]`);
    if (button) {
        button.textContent = '✓ В корзине';
        button.disabled = true;
        button.classList.add('in-cart');
        button.style.background = 'var(--gray-medium)';
        button.style.color = 'var(--gray-dark)';
    }
    
    // Показываем уведомление
    showNotification(`"${tool.name}" добавлен в корзину`);
    
    // Автоматически открываем корзину при первом добавлении
    if (cart.length === 1) {
        setTimeout(() => openCart(), 500);
    }
}

// Анимация при добавлении в корзину
function animateCart() {
    const cartCount = document.getElementById('cartCount');
    if (!cartCount) return;
    
    cartCount.style.transform = 'scale(1.5)';
    cartCount.style.backgroundColor = 'var(--accent-yellow)';
    
    setTimeout(() => {
        cartCount.style.transform = 'scale(1)';
        cartCount.style.backgroundColor = 'var(--primary-blue)';
    }, 300);
}

// Удаление из корзины
function removeFromCart(toolId) {
    cart = cart.filter(item => item.id !== toolId);
    saveCart();
    updateCartDisplay();
    
    // Обновляем кнопку в карточке товара
    const button = document.querySelector(`.add-to-cart-btn[onclick="addToCart(${toolId})"]`);
    if (button) {
        button.textContent = 'В корзину';
        button.disabled = false;
        button.classList.remove('in-cart');
        button.style.background = '';
        button.style.color = '';
    }
}

// Обновление отображения корзины
function updateCartDisplay() {
    // Обновляем счетчик в шапке
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
    
    // Обновляем список товаров в корзине
    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart">Корзина пуста</div>';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60x60/F8FAFC/94A3B8?text=Товар'">
                    </div>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${item.price} руб/сутки</div>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})">×</button>
                </div>
            `).join('');
        }
    }
    
    // Обновляем итоговую сумму
    updateCartTotal();
}

// Обновление итоговой суммы
function updateCartTotal() {
    const daysInput = document.getElementById('rentDays');
    const days = parseInt(daysInput.value) || 1;
    
    // Обновляем отображение количества дней
    const daysCount = document.getElementById('daysCount');
    if (daysCount) {
        daysCount.textContent = days;
    }
    
    // Рассчитываем суммы
    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const total = subtotal * days;
    
    // Обновляем отображение сумм
    const subtotalEl = document.getElementById('subtotal');
    const totalPriceEl = document.getElementById('totalPrice');
    
    if (subtotalEl) subtotalEl.textContent = `${subtotal} руб`;
    if (totalPriceEl) totalPriceEl.textContent = `${total} руб`;
}

// Сохранение корзины
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Переключение видимости корзины
function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    
    if (!cartSidebar) return;
    
    if (cartSidebar.classList.contains('active')) {
        closeCart();
    } else {
        openCart();
    }
}

// Открытие корзины
function openCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (!cartSidebar) return;
    
    // Создаем оверлей если его нет
    if (!document.querySelector('.cart-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'cart-overlay';
        overlay.onclick = toggleCart;
        document.body.appendChild(overlay);
    }
    
    cartSidebar.classList.add('active');
    document.querySelector('.cart-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Закрытие корзины
function closeCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.querySelector('.cart-overlay');
    
    if (cartSidebar) cartSidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Очистка корзины
function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Вы уверены, что хотите очистить корзину?')) {
        // Восстанавливаем кнопки на всех товарах
        cart.forEach(item => {
            const button = document.querySelector(`.add-to-cart-btn[onclick="addToCart(${item.id})"]`);
            if (button) {
                button.textContent = 'В корзину';
                button.disabled = false;
                button.classList.remove('in-cart');
                button.style.background = '';
                button.style.color = '';
            }
        });
        
        cart = [];
        saveCart();
        updateCartDisplay();
        showNotification('Корзина очищена');
    }
}

// ==================== ОФОРМЛЕНИЕ ЗАКАЗА (ИСПРАВЛЕННАЯ ВЕРСИЯ С КРАСИВЫМ ОКНОМ) ====================

// Оформление заказа - С КРАСИВЫМ ОКНОМ
function checkout() {
    if (cart.length === 0) {
        alert('Корзина пуста');
        return;
    }
    
    const daysInput = document.getElementById('rentDays');
    const days = parseInt(daysInput.value) || 1;
    
    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const total = subtotal * days;
    
    // Сохраняем заказ в историю
    saveOrderToHistory(cart, days, total);
    
    // Показываем красивое окно
    showThankYouModal();
    
    // Очищаем корзину
    clearCart();
}

// Сохранение заказа в историю
function saveOrderToHistory(items, days, total) {
    const newOrder = {
        id: Date.now(),
        date: new Date().toLocaleDateString('ru-RU'),
        items: items.map(item => ({
            name: item.name,
            price: item.price,
            days: days
        })),
        total: total,
        status: 'new'
    };
    
    orderHistory.unshift(newOrder);
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
    
    // Обновляем профиль пользователя
    userProfile.orders += 1;
    
    // Начисляем скидку за каждый 5-й заказ
    if (userProfile.orders % 5 === 0) {
        userProfile.discount = Math.min(userProfile.discount + 5, 20);
    }
    
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
}

// Функция для красивого окна
function showThankYouModal() {
    // Создаем элемент затемнения
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '2000';
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        max-width: 400px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        animation: fadeInUp 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="font-size: 5rem; margin-bottom: 20px;">✅</div>
        <h2 style="color: var(--primary-blue); margin-bottom: 20px;">Спасибо за заказ!</h2>
        <p style="font-size: 1.2rem; margin-bottom: 30px; color: var(--gray-dark);">С вами скоро свяжется оператор</p>
        <button onclick="this.closest('.modal-overlay').remove()" 
                style="background: var(--accent-yellow); color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer;">
            Закрыть
        </button>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Добавляем анимацию, если её нет
    if (!document.querySelector('#thankYouStyles')) {
        const style = document.createElement('style');
        style.id = 'thankYouStyles';
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Автоматически закрываем через 5 секунд
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.remove();
        }
    }, 5000);
}

// ==================== ФУНКЦИИ ПОИСКА ====================

// Поиск инструментов
function searchTools(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
        if (allTools.length > 0) {
            displayCatalog(allTools);
        } else {
            displayStaticCatalog();
        }
        return;
    }
    
    const filteredTools = allTools.filter(tool => 
        tool.name.toLowerCase().includes(searchTerm) ||
        (tool.description && tool.description.toLowerCase().includes(searchTerm))
    );
    
    displayCatalog(filteredTools);
}

// ==================== ФУНКЦИИ АВТОРИЗАЦИИ ====================

// Инициализация форм авторизации
function initAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Показать модальное окно входа/регистрации
function showLogin() {
    closeAllDropdowns();
    const authModal = document.getElementById('authModal');
    if (!authModal) {
        console.error('Модальное окно авторизации не найдено');
        return;
    }
    
    authModal.classList.add('active');
    document.querySelector('.modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Сбрасываем на форму входа
    authMode = 'login';
    updateAuthModal();
}

// Закрыть модальное окно авторизации
function closeAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.remove('active');
    }
    document.querySelector('.modal-overlay').classList.remove('active');
    document.body.style.overflow = '';
    
    // Очищаем формы
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm) loginForm.reset();
    if (registerForm) registerForm.reset();
    
    // Убираем сообщения об ошибках
    removeAuthMessages();
}

// Переключение между входом и регистрацией
function toggleAuthMode() {
    authMode = authMode === 'login' ? 'register' : 'login';
    updateAuthModal();
}

// Обновление модального окна
function updateAuthModal() {
    const modalTitle = document.getElementById('authModalTitle');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const switchText = document.getElementById('authSwitchText');
    const switchBtn = document.getElementById('authSwitchBtn');
    
    if (!modalTitle || !loginForm || !registerForm || !switchText || !switchBtn) return;
    
    if (authMode === 'login') {
        modalTitle.textContent = 'Вход в систему';
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        switchText.textContent = 'Нет аккаунта?';
        switchBtn.textContent = 'Зарегистрироваться';
    } else {
        modalTitle.textContent = 'Регистрация';
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        switchText.textContent = 'Уже есть аккаунт?';
        switchBtn.textContent = 'Войти';
    }
    
    removeAuthMessages();
}

// Удаление сообщений об ошибках/успехе
function removeAuthMessages() {
    document.querySelectorAll('.error-message, .success-message').forEach(el => el.remove());
}

// Показать сообщение об ошибке
function showAuthError(message) {
    removeAuthMessages();
    const form = authMode === 'login' ? 'loginForm' : 'registerForm';
    const formElement = document.getElementById(form);
    
    if (!formElement) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    formElement.appendChild(errorDiv);
}

// Показать сообщение об успехе
function showAuthSuccess(message) {
    removeAuthMessages();
    const form = authMode === 'login' ? 'loginForm' : 'registerForm';
    const formElement = document.getElementById(form);
    
    if (!formElement) return;
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    formElement.appendChild(successDiv);
}

// Обработка входа
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            isAuthenticated = true;
            currentUser = data.user;
            
            // Обновляем localStorage для совместимости
            userProfile = {
                name: currentUser.name,
                email: currentUser.email,
                phone: currentUser.phone || '',
                address: currentUser.address || '',
                orders: userProfile.orders,
                discount: userProfile.discount
            };
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            localStorage.setItem('isLoggedIn', 'true');
            
            updateUserInfo();
            closeAuthModal();
            showNotification(`Добро пожаловать, ${currentUser.name}!`);
            
            // Если админ - показываем ссылку
            if (currentUser.isAdmin) {
                showAdminLink();
            }
        } else {
            showAuthError(data.error || 'Ошибка входа');
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        showAuthError('Ошибка соединения с сервером');
    }
}

// Обработка регистрации
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const address = document.getElementById('regAddress').value;
    
    // Валидация
    if (password !== confirmPassword) {
        showAuthError('Пароли не совпадают');
        return;
    }
    
    if (password.length < 6) {
        showAuthError('Пароль должен быть не менее 6 символов');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, phone, address })
        });
        
        const data = await response.json();
        
        if (data.success) {
            isAuthenticated = true;
            currentUser = data.user;
            
            // Обновляем localStorage
            userProfile = {
                name: currentUser.name,
                email: currentUser.email,
                phone: currentUser.phone || '',
                address: currentUser.address || '',
                orders: 0,
                discount: 0
            };
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            localStorage.setItem('isLoggedIn', 'true');
            
            updateUserInfo();
            closeAuthModal();
            showNotification('Регистрация успешна! Добро пожаловать!');
        } else {
            showAuthError(data.error || 'Ошибка регистрации');
        }
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        showAuthError('Ошибка соединения с сервером');
    }
}

// Проверка авторизации при загрузке
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (data.success) {
            isAuthenticated = true;
            currentUser = data.user;
            
            // Обновляем localStorage для совместимости
            userProfile = {
                name: currentUser.name,
                email: currentUser.email,
                phone: currentUser.phone || '',
                address: currentUser.address || '',
                orders: userProfile.orders,
                discount: userProfile.discount
            };
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            localStorage.setItem('isLoggedIn', 'true');
            
            updateUserInfo();
            
            // Если админ - показываем ссылку на админку
            if (currentUser.isAdmin) {
                showAdminLink();
            }
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
    }
}

// Выход из системы
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            isAuthenticated = false;
            currentUser = null;
            
            // Очищаем localStorage
            userProfile = {
                name: '',
                email: '',
                phone: '',
                address: '',
                orders: 0,
                discount: 0
            };
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            localStorage.removeItem('isLoggedIn');
            
            updateUserInfo();
            
            // Убираем ссылку на админку
            const adminLink = document.querySelector('.admin-link');
            if (adminLink) {
                adminLink.remove();
            }
            
            showNotification('Вы вышли из системы');
            
            // Закрываем меню
            closeAllDropdowns();
        }
    } catch (error) {
        console.error('Ошибка выхода:', error);
    }
}

// Показать ссылку на админку для админов
function showAdminLink() {
    // Добавляем ссылку на админку в навигацию
    const nav = document.querySelector('.main-nav');
    if (nav && !document.querySelector('.admin-link')) {
        const adminLink = document.createElement('a');
        adminLink.href = '/admin';
        adminLink.className = 'nav-link admin-link';
        adminLink.textContent = '👨‍💼 Админ-панель';
        nav.appendChild(adminLink);
    }
}

// Обновление информации о пользователе в меню
function updateUserInfo() {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userPhone = document.getElementById('userPhone');
    const userOrdersCount = document.getElementById('userOrdersCount');
    const userDiscount = document.getElementById('userDiscount');
    const loginBtn = document.querySelector('.login-btn');
    
    if (!userName || !userEmail || !loginBtn) return;
    
    if (isAuthenticated && currentUser) {
        userName.textContent = currentUser.name || 'Пользователь';
        userEmail.textContent = currentUser.email || '';
        
        if (userPhone) {
            userPhone.textContent = currentUser.phone || '';
            userPhone.style.display = currentUser.phone ? 'block' : 'none';
        }
        
        if (userOrdersCount) userOrdersCount.textContent = userProfile.orders || 0;
        if (userDiscount) userDiscount.textContent = `${userProfile.discount || 0}%`;
        
        // Меняем кнопку на "Выйти"
        loginBtn.textContent = 'Выйти из аккаунта';
        loginBtn.onclick = logout;
    } else {
        userName.textContent = 'Гость';
        userEmail.textContent = 'Не авторизован';
        if (userPhone) {
            userPhone.style.display = 'none';
        }
        if (userOrdersCount) userOrdersCount.textContent = '0';
        if (userDiscount) userDiscount.textContent = '0%';
        
        // Меняем кнопку обратно
        loginBtn.textContent = 'Войти / Зарегистрироваться';
        loginBtn.onclick = showLogin;
    }
}

// ==================== ФУНКЦИИ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ ====================

// Переключение меню пользователя
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.classList.toggle('active');
    
    // Обновляем информацию о пользователе
    updateUserInfo();
}

// Показать профиль
function showProfile() {
    closeAllDropdowns();
    document.getElementById('profileModal').classList.add('active');
    document.querySelector('.modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Заполняем форму текущими данными
    document.getElementById('profileName').value = currentUser?.name || userProfile.name || '';
    document.getElementById('profileEmail').value = currentUser?.email || userProfile.email || '';
    document.getElementById('profilePhone').value = currentUser?.phone || userProfile.phone || '';
    document.getElementById('profileAddress').value = currentUser?.address || userProfile.address || '';
}

// Показать способы оплаты
function showPaymentMethods() {
    closeAllDropdowns();
    document.getElementById('paymentModal').classList.add('active');
    document.querySelector('.modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    loadSavedCards();
}

// Показать историю заказов
function showOrderHistory() {
    closeAllDropdowns();
    document.getElementById('ordersModal').classList.add('active');
    document.querySelector('.modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    loadOrderHistory();
}

// Показать настройки (заглушка)
function showSettings() {
    closeAllDropdowns();
    alert('Раздел настроек находится в разработке');
}

// Сохранить профиль
async function saveProfile() {
    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const address = document.getElementById('profileAddress').value.trim();
    
    if (!name || !email) {
        alert('Пожалуйста, заполните обязательные поля (ФИО и Email)');
        return;
    }
    
    if (isAuthenticated) {
        // Сохраняем на сервере
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, phone, address })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Обновляем локальные данные
                currentUser.name = name;
                currentUser.phone = phone;
                currentUser.address = address;
                
                userProfile = {
                    name: name,
                    email: email,
                    phone: phone,
                    address: address,
                    orders: userProfile.orders,
                    discount: userProfile.discount
                };
                
                localStorage.setItem('userProfile', JSON.stringify(userProfile));
                updateUserInfo();
                closeModal('profileModal');
                showNotification('Профиль успешно обновлен!');
            } else {
                alert('Ошибка обновления профиля: ' + data.error);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка соединения с сервером');
        }
    } else {
        // Сохраняем только в localStorage
        userProfile = {
            name: name,
            email: email,
            phone: phone,
            address: address,
            orders: userProfile.orders,
            discount: userProfile.discount
        };
        
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        localStorage.setItem('isLoggedIn', 'true');
        
        updateUserInfo();
        closeModal('profileModal');
        showNotification('Профиль успешно обновлен!');
    }
}

// Загрузить сохраненные карты
function loadSavedCards() {
    const savedCardsContainer = document.getElementById('savedCards');
    
    if (savedCards.length === 0) {
        savedCardsContainer.innerHTML = '<div class="empty-cards">У вас нет привязанных карт</div>';
        return;
    }
    
    savedCardsContainer.innerHTML = savedCards.map((card, index) => `
        <div class="saved-card-item">
            <div class="card-info">
                <div class="card-icon">💳</div>
                <div class="card-details">
                    <div class="card-number">**** **** **** ${card.last4}</div>
                    <div class="card-name">${card.name}</div>
                    <div class="card-expiry">Действует до: ${card.expiry}</div>
                </div>
            </div>
            <button class="delete-card-btn" onclick="deleteCard(${index})">×</button>
        </div>
    `).join('');
}

// Показать форму добавления карты
function showAddCardForm() {
    document.getElementById('addCardForm').style.display = 'block';
    
    // Очистка полей формы
    document.getElementById('cardNumber').value = '';
    document.getElementById('cardExpiry').value = '';
    document.getElementById('cardCVC').value = '';
    document.getElementById('cardName').value = '';
    document.getElementById('saveCard').checked = true;
}

// Скрыть форму добавления карты
function hideAddCardForm() {
    document.getElementById('addCardForm').style.display = 'none';
}

// Сохранить карту
function saveCard() {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCVC = document.getElementById('cardCVC').value;
    const cardName = document.getElementById('cardName').value.trim();
    const saveCard = document.getElementById('saveCard').checked;
    
    // Валидация
    if (cardNumber.length !== 16) {
        alert('Номер карты должен содержать 16 цифр');
        return;
    }
    
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        alert('Неверный формат срока действия (ММ/ГГ)');
        return;
    }
    
    if (cardCVC.length !== 3) {
        alert('CVC должен содержать 3 цифры');
        return;
    }
    
    if (!cardName) {
        alert('Пожалуйста, введите имя на карте');
        return;
    }
    
    const newCard = {
        number: cardNumber,
        last4: cardNumber.slice(-4),
        expiry: cardExpiry,
        name: cardName.toUpperCase(),
        cvc: cardCVC,
        saved: saveCard
    };
    
    savedCards.push(newCard);
    localStorage.setItem('savedCards', JSON.stringify(savedCards));
    
    loadSavedCards();
    hideAddCardForm();
    showNotification('Карта успешно добавлена!');
}

// Удалить карту
function deleteCard(index) {
    if (confirm('Вы уверены, что хотите удалить эту карту?')) {
        savedCards.splice(index, 1);
        localStorage.setItem('savedCards', JSON.stringify(savedCards));
        loadSavedCards();
        showNotification('Карта удалена');
    }
}

// Загрузить историю заказов
function loadOrderHistory() {
    const ordersList = document.getElementById('ordersList');
    
    if (orderHistory.length === 0) {
        ordersList.innerHTML = '<div class="empty-orders">У вас пока нет заказов</div>';
        return;
    }
    
    ordersList.innerHTML = orderHistory.map((order, index) => `
        <div class="order-item">
            <div class="order-header">
                <span class="order-number">#${order.id || index + 1}</span>
                <span class="order-date">${order.date || 'Дата не указана'}</span>
                <span class="order-status ${order.status}">${order.status || 'Завершен'}</span>
            </div>
            <div class="order-details">
                <div class="order-items">
                    ${order.items ? order.items.map(item => `
                        <div class="order-item-row">
                            <span>${item.name}</span>
                            <span>${item.days} дней × ${item.price} руб</span>
                        </div>
                    `).join('') : ''}
                </div>
                <div class="order-total">
                    <span>Итого:</span>
                    <span>${order.total || 0} руб</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== ФУНКЦИИ КАЛЬКУЛЯТОРА ====================

// Инициализация калькулятора
function initCalculator() {
    const calcButton = document.getElementById('calcButton');
    const addToCartBtn = document.getElementById('addToCartBtn');
    
    if (calcButton) {
        calcButton.addEventListener('click', calculateRental);
    }
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', addToCartFromCalculator);
    }
    
    // Автоматический расчет при изменении полей
    const calcDays = document.getElementById('calcDays');
    const calcDiscount = document.getElementById('calcDiscount');
    
    if (calcDays) {
        calcDays.addEventListener('input', function() {
            const days = parseInt(this.value) || 0;
            const discountSelect = document.getElementById('calcDiscount');
            
            if (days >= 30) {
                discountSelect.value = '15';
            } else if (days >= 14) {
                discountSelect.value = '10';
            } else if (days >= 7) {
                discountSelect.value = '5';
            } else {
                discountSelect.value = '0';
            }
        });
    }
}

// Расчет стоимости аренды
function calculateRental() {
    const toolSelect = document.getElementById('calcTool');
    const daysInput = document.getElementById('calcDays');
    const discountSelect = document.getElementById('calcDiscount');
    const deliveryCheckbox = document.getElementById('calcDelivery');
    
    const toolPrice = parseInt(toolSelect.value) || 0;
    const days = parseInt(daysInput.value) || 0;
    const discount = parseInt(discountSelect.value) || 0;
    const delivery = deliveryCheckbox && deliveryCheckbox.checked ? parseInt(deliveryCheckbox.value) : 0;
    
    if (toolPrice === 0) {
        alert('Пожалуйста, выберите инструмент');
        return;
    }
    
    if (days < 1) {
        alert('Количество дней должно быть не менее 1');
        return;
    }
    
    if (days > 30) {
        alert('Максимальный срок аренды — 30 дней');
        daysInput.value = 30;
        return;
    }
    
    // Расчет стоимости
    let subtotal = toolPrice * days;
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount + delivery;
    
    // Обновление результатов
    document.getElementById('resultTool').textContent = toolSelect.options[toolSelect.selectedIndex].text.split(' - ')[0];
    document.getElementById('resultDaily').textContent = `${toolPrice} руб`;
    document.getElementById('resultDays').textContent = `${days} дней`;
    document.getElementById('resultDiscount').textContent = `${discount}% (-${Math.round(discountAmount)} руб)`;
    document.getElementById('resultDelivery').textContent = delivery > 0 ? `${delivery} руб` : 'Нет';
    document.getElementById('resultTotal').textContent = `${Math.round(total)} руб`;
    
    // Сохраняем данные для добавления в корзину
    window.calculatorData = {
        toolName: toolSelect.options[toolSelect.selectedIndex].text.split(' - ')[0],
        price: toolPrice,
        days: days,
        total: Math.round(total),
        toolId: toolSelect.options[toolSelect.selectedIndex].dataset.id
    };
    
    showNotification('Расчет выполнен успешно!');
}

// Добавление из калькулятора в корзину
function addToCartFromCalculator() {
    if (!window.calculatorData) {
        alert('Сначала рассчитайте стоимость аренды');
        return;
    }
    
    const { toolName, price, days, total, toolId } = window.calculatorData;
    
    // Ищем инструмент в массиве allTools
    const tool = allTools.find(t => t.name.includes(toolName) || t.id == toolId);
    
    if (!tool) {
        alert('Инструмент не найден в каталоге');
        return;
    }
    
    if (tool.status !== 'available') {
        alert('Этот инструмент сейчас недоступен для аренды');
        return;
    }
    
    // Добавляем в корзину
    addToCart(tool.id);
    
    // Обновляем количество дней в корзине
    const cartItem = cart.find(item => item.id === tool.id);
    if (cartItem) {
        cartItem.days = days;
        saveCart();
        updateCartTotal();
    }
    
    // Показываем уведомление
    showNotification(`Инструмент "${toolName}" добавлен в корзину на ${days} дней!`);
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Показ уведомления
function showNotification(message) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-green);
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
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }, 3000);
}

// Закрытие модального окна контактов (больше не используется, но оставляем для совместимости)
function closeContactModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Закрытие модального окна
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.querySelector('.modal-overlay').classList.remove('active');
    document.body.style.overflow = '';
}

// Закрытие всех модальных окон
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Закрытие всех выпадающих меню
function closeAllDropdowns() {
    const userMenu = document.getElementById('userMenu');
    const cartSidebar = document.getElementById('cartSidebar');
    
    if (userMenu) userMenu.classList.remove('active');
    if (cartSidebar) cartSidebar.classList.remove('active');
}

// Инициализация форматирования полей ввода
function initInputFormatters() {
    // Форматирование номера карты
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(.{4})/g, '$1 ').trim();
            e.target.value = value;
        });
    }
    
    // Форматирование срока действия карты
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        });
    }
    
    // Форматирование CVC
    const cardCVCInput = document.getElementById('cardCVC');
    if (cardCVCInput) {
        cardCVCInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
    
    // Форматирование телефона в профиле
    const profilePhoneInput = document.getElementById('profilePhone');
    if (profilePhoneInput) {
        profilePhoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                value = '+' + value;
                if (value.length > 2) value = value.slice(0, 2) + ' (' + value.slice(2);
                if (value.length > 6) value = value.slice(0, 6) + ') ' + value.slice(6);
                if (value.length > 11) value = value.slice(0, 11) + '-' + value.slice(11);
                if (value.length > 14) value = value.slice(0, 14) + '-' + value.slice(14);
            }
            e.target.value = value;
        });
    }
}

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

// Закрытие корзины по клику на оверлей
document.addEventListener('click', function(e) {
    // Закрытие корзины
    if (e.target.classList.contains('cart-overlay')) {
        toggleCart();
    }
    
    // Закрытие меню пользователя при клике вне его
    const userMenu = document.getElementById('userMenu');
    const userIcon = document.querySelector('.user-icon-btn');
    
    if (userMenu && userMenu.classList.contains('active') && 
        !userMenu.contains(e.target) && 
        !userIcon?.contains(e.target)) {
        userMenu.classList.remove('active');
    }
});

// Закрытие по Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Закрытие корзины
        closeCart();
        
        // Закрытие меню пользователя
        const userMenu = document.getElementById('userMenu');
        if (userMenu) userMenu.classList.remove('active');
        
        // Закрытие всех модальных окон
        closeAllModals();
        
        // Закрытие модального окна авторизации
        closeAuthModal();
    }
});

// Обновление статуса инструмента (для админ-панели)
function updateToolStatus(toolId, status) {
    fetch(`/api/tools/${toolId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: status })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Статус инструмента обновлен');
            loadTools(); // Обновляем список инструментов
        } else {
            alert('Ошибка обновления статуса: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Не удалось обновить статус');
    });
}