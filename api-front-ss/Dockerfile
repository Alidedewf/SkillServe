# Используем базовый образ Node.js
FROM node:16-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект в контейнер
COPY . .

# Собираем проект
RUN npm run build

# Устанавливаем HTTP-сервер для обслуживания сборки
RUN npm install -g serve

# Указываем порт, который будет использовать приложение
EXPOSE 3000

# Команда для запуска собранного приложения
CMD ["serve", "-s", "build"]