# ─── SkillServe Backend (Node + Prisma) ─────────────────────────────
FROM node:20-alpine

# Prisma engines требуют openssl
RUN apk add --no-cache openssl

WORKDIR /app

# Зависимости (ставим все — prisma CLI нужен для migrate deploy на старте).
# npm install ДО NODE_ENV=production, иначе devDependencies не поставятся.
COPY package.json ./
RUN npm install

# Prisma-схема + генерация клиента
COPY prisma ./prisma
RUN npx prisma generate

# Исходники
COPY . .

ENV NODE_ENV=production
EXPOSE 5001

RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
