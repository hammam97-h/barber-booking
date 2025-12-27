
FROM node:20-alpine

WORKDIR /app

# تفعيل pnpm
RUN corepack enable

# نسخ الملفات
COPY . .

# تثبيت الحزم
RUN pnpm install

# متغيرات البيئة
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# تشغيل السيرفر
CMD ["pnpm", "start"]
