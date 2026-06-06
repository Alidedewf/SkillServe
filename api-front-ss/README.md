# SkillServe — Frontend

Клиентская часть платформы обучения персонала HoReCa. Мобильное (mobile-first) SPA-приложение на React.

## Технологии

| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 19 | UI-библиотека |
| React Router DOM | 7 | Маршрутизация SPA |
| Framer Motion | 11 | Анимации и переходы |
| React Icons | 5 | Иконки (Feather, etc.) |
| Axios | 1.7 | HTTP-клиент (не используется напрямую, fetch) |
| CSS Modules | — | Изолированные стили компонентов |

## Быстрый старт

```bash
# 1. Установить зависимости
npm install

# 2. Запустить dev-сервер (порт 3000)
npm start
```

> **Важно:** Бэкенд должен быть запущен на `http://localhost:5001`. API_URL задан в `src/services/api.js`.

## Структура проекта

```
src/
├── App.jsx                    # Корневой компонент с маршрутами
├── index.js                   # Точка входа React
├── index.css                  # Глобальные стили
│
├── services/
│   └── api.js                 # Все HTTP-запросы к бэкенду (fetch + JWT)
│
├── i18n/
│   └── translations.js        # Мультиязычность (ru / en / kz)
│
├── components/
│   └── admin/
│       ├── AdminLayout.jsx    # Layout для админ-панели
│       ├── ProtectedAdminRoute.jsx
│       └── ProtectedSuperAdminRoute.jsx
│
├── pages/
│   ├── user/                  # Страницы пользователя (сотрудника)
│   │   ├── Dashboard.jsx      # Главная (домашняя)
│   │   ├── Course.jsx         # Список курсов (Новые / В процессе / Пройденные)
│   │   ├── CourseLessonsPage.jsx  # Уроки конкретного курса
│   │   ├── LessonPage.jsx     # Просмотр урока (текст / видео)
│   │   ├── TestPage.jsx       # Прохождение теста
│   │   ├── TestResultsPage.jsx # Результаты теста
│   │   ├── ArchivedCourses.jsx # Завершённые курсы
│   │   ├── Certificates.jsx   # Сертификаты (генерация Canvas)
│   │   ├── Rating.jsx         # Рейтинг сотрудников
│   │   ├── Profile.jsx        # Профиль пользователя
│   │   ├── EditProfile.jsx    # Редактирование профиля
│   │   ├── Notifications.jsx  # Уведомления
│   │   ├── MenuPage.jsx       # Меню ресторана
│   │   ├── FAQ.jsx            # Часто задаваемые вопросы
│   │   ├── Resources.jsx      # Полезные ресурсы
│   │   ├── Login.jsx          # Авторизация
│   │   ├── ResetPassword.jsx  # Сброс пароля (email)
│   │   ├── VerifyCode.jsx     # Ввод кода подтверждения
│   │   ├── ChangePassword.jsx # Смена пароля
│   │   └── LanguageSelection.jsx # Выбор языка (стартовый экран)
│   │
│   └── admin/                 # Страницы админ-панели
│       ├── AdminDashboard.jsx     # Дашборд админа
│       ├── AdminCourses.jsx       # Управление курсами
│       ├── AdminCourseEditor.jsx  # Редактор курса (уроки, тесты)
│       ├── AdminUsers.jsx         # Управление сотрудниками
│       ├── AdminMenu.jsx          # Управление меню ресторана
│       ├── AdminOrgStructure.jsx  # Оргструктура (отделы, должности)
│       ├── AdminAchievements.jsx  # Управление достижениями
│       ├── SuperAdminDashboard.jsx     # Дашборд SuperAdmin
│       └── SuperAdminRestaurants.jsx   # Управление ресторанами
│
└── assets/                    # Статические ресурсы (изображения)
```

## Ролевая модель (маршруты)

| Роль | Доступные страницы |
|------|-------------------|
| `USER` | `/home`, `/courses`, `/course/:id`, `/profile`, `/certificates`, `/rating`, `/menu`, `/faq`, `/notifications` |
| `ADMIN` | Всё выше + `/admin/*` (курсы, сотрудники, меню, оргструктура, достижения) |
| `SUPER_ADMIN` | Всё выше + `/superadmin/*` (управление ресторанами платформы) |

## Авторизация

- JWT-токен хранится в `localStorage` под ключом `token`.
- При каждом запросе к API токен прикрепляется в заголовок `Authorization: Bearer <token>`.
- Роль хранится в `localStorage` под ключом `role` для клиентской маршрутизации.

## Мультиязычность

Поддерживаемые языки: **Русский (ru)**, **English (en)**, **Қазақша (kz)**.  
Язык хранится в `localStorage` под ключом `lang`.

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm start` | Запуск dev-сервера на порту 3000 |
| `npm run build` | Продакшн-сборка в папку `build/` |
| `npm test` | Запуск тестов (Jest) |