# SkillServe — Backend API

REST API бэкенд для платформы обучения персонала HoReCa. Мультитенантная архитектура с изоляцией данных по ресторанам.

## Технологии

| Технология | Версия | Назначение |
|------------|--------|------------|
| Node.js | 18+ | Среда выполнения |
| Express | 4.19 | HTTP-фреймворк |
| Prisma | 5.13 | ORM для PostgreSQL |
| PostgreSQL (Neon) | 15 | Облачная БД (serverless) |
| JWT (jsonwebtoken) | 9 | Авторизация по токенам |
| bcrypt | 5 | Хеширование паролей |
| Multer | 2 | Загрузка файлов (логотипы, PDF) |
| Google Generative AI | 0.24 | Генерация курсов через Gemini |

## Быстрый старт

```bash
# 1. Установить зависимости
npm install

# 2. Создать файл .env (см. раздел "Переменные окружения")

# 3. Сгенерировать Prisma Client
npx prisma generate

# 4. Применить схему к БД
npx prisma db push

# 5. (Опционально) Заполнить БД начальными данными (создаст SUPER_ADMIN)
npx prisma db seed

# 6. Запустить dev-сервер (порт 5001, с hot-reload через nodemon)
npm run dev
```

## Переменные окружения (.env)

```env
# Database (PostgreSQL — Neon Serverless)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=5001

# Frontend URL (для CORS)
CLIENT_URL="http://localhost:3000"

# AI (Google Gemini — для генерации курсов)
GEMINI_API_KEY="your-gemini-api-key"
```

## Структура проекта

```
├── server.js                  # Точка входа (загрузка .env, запуск Express)
├── package.json
├── prisma/
│   ├── schema.prisma          # Схема БД (все модели)
│   └── seed.js                # Сидирование (создание SUPER_ADMIN)
│
└── src/
    ├── app.js                 # Express app (middleware, роуты)
    ├── prisma.js              # Singleton Prisma Client (с авто-реконнектом для Neon)
    │
    ├── config/
    │   └── index.js           # Централизованная конфигурация из env
    │
    ├── common/
    │   ├── middleware/
    │   │   ├── auth.middleware.js    # Проверка JWT-токена
    │   │   ├── role.middleware.js    # Проверка роли (ADMIN, SUPER_ADMIN)
    │   │   └── tenant.middleware.js  # Изоляция данных по restaurant_id
    │   └── utils/
    │       └── errors.js            # Фабрика ошибок (notFound, unauthorized, etc.)
    │
    └── modules/
        ├── auth/              # Авторизация (login, /me)
        ├── users/             # Пользователи (профиль, уведомления, аватар)
        ├── courses/           # Курсы и уроки
        ├── tests/             # Тесты и проверка ответов
        ├── rating/            # Рейтинг сотрудников
        ├── achievements/      # Достижения
        ├── menu/              # Меню ресторана (user + admin)
        ├── ai/                # Генерация курсов через Google Gemini
        ├── admin/             # Админ-операции (CRUD сотрудников)
        ├── org-structure/     # Отделы и должности
        └── restaurant/        # Управление ресторанами (SUPER_ADMIN)
```

## API Endpoints

### Публичные (без авторизации)

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/auth/login` | Авторизация (email + password → JWT) |
| `GET` | `/api/health` | Health check |

### Пользователь (USER) — требуется JWT

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/auth/me` | Текущий пользователь |
| `GET` | `/api/users/profile` | Профиль с данными ресторана |
| `PUT` | `/api/users/profile` | Обновление профиля |
| `GET` | `/api/users/notifications` | Уведомления пользователя |
| `GET` | `/api/courses` | Новые курсы (для ресторана) |
| `GET` | `/api/courses/in-progress` | Курсы в процессе |
| `GET` | `/api/courses/archived` | Завершённые курсы |
| `GET` | `/api/courses/:id` | Детали курса с уроками |
| `POST` | `/api/courses/:id/start` | Начать прохождение курса |
| `GET` | `/api/lessons/:id` | Содержание урока |
| `POST` | `/api/lessons/:id/complete` | Отметить урок как пройденный |
| `GET` | `/api/tests/:id` | Получить вопросы теста |
| `POST` | `/api/tests/:id/submit` | Отправить ответы теста |
| `GET` | `/api/rating` | Рейтинг сотрудников ресторана |
| `GET` | `/api/menu` | Меню ресторана |
| `GET` | `/api/achievements` | Достижения |

### Админ (ADMIN) — требуется JWT + роль ADMIN

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/admin/users` | Список сотрудников ресторана |
| `POST` | `/api/admin/users` | Создать сотрудника |
| `PUT` | `/api/admin/users/:id` | Редактировать сотрудника |
| `DELETE` | `/api/admin/users/:id` | Удалить сотрудника |
| `POST` | `/api/admin/ai/generate-course` | Сгенерировать курс через ИИ |
| `POST` | `/api/admin/menu/upload-pdf` | Загрузить PDF-меню |
| `GET/POST/PUT/DELETE` | `/api/org/departments` | CRUD отделов |
| `GET/POST/PUT/DELETE` | `/api/org/positions` | CRUD должностей |

### СуперАдмин (SUPER_ADMIN)

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/restaurants` | Все рестораны платформы |
| `POST` | `/api/restaurants` | Создать ресторан |
| `PUT` | `/api/restaurants/:id` | Редактировать ресторан |
| `DELETE` | `/api/restaurants/:id` | Удалить ресторан |

## Модели БД (Prisma)

```
Restaurant ─┬─ User ─┬─ UserCourseProgress
             │        ├─ UserLessonProgress
             │        ├─ TestAttempt
             │        ├─ UserAchievement
             │        └─ Notification
             │
             ├─ Department ── Position ── User
             │
             ├─ Course ─┬─ Lesson ── UserLessonProgress
             │          ├─ Test ─── Question ── Answer
             │          └─ Achievement
             │
             ├─ MenuCategory ── MenuItem
             └─ RestaurantSetting
```

## Мультитенантность

Данные изолированы по `restaurant_id`. Middleware `tenant.middleware.js` извлекает `restaurantId` из JWT-токена и внедряет его в `req.restaurantId`. Все сервисы фильтруют данные по этому ID, гарантируя что пользователь одного ресторана не может видеть данные другого.

## Учётные записи по умолчанию (seed)

| Роль | Email | Пароль |
|------|-------|--------|
| `SUPER_ADMIN` | `superadmin@skillserve.com` | `superadminpassword` |

> Остальные пользователи (ADMIN, USER) создаются через интерфейс SuperAdmin → Рестораны → Создать Admin, или через Admin → Сотрудники.

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Dev-сервер с hot-reload (nodemon) |
| `npm start` | Продакшн-запуск |
| `npm run db:generate` | Генерация Prisma Client |
| `npm run db:migrate` | Миграция БД |
| `npm run db:studio` | Prisma Studio (GUI для БД) |
