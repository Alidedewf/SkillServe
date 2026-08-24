# ─── SkillServe Frontend (React build → nginx) ──────────────────────
# Этап 1: сборка
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# API вызывается с того же origin: /api (nginx проксирует на backend).
# CRA подставляет REACT_APP_* на этапе сборки.
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV CI=false
RUN npm run build

# Этап 2: раздача статики + прокси /api
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
