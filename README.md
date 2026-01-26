# Back Shop - NestJS + MongoDB

Чистый проект на NestJS с подключением к MongoDB.

## Установка

```bash
# Установка зависимостей
npm install
```

## Настройка переменных окружения

1. Скопируйте файл `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. Отредактируйте `.env` и укажите настройки подключения к MongoDB:

### Локальная MongoDB (без аутентификации)
```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/back-shop
```

### Локальная MongoDB (с аутентификацией)
```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://username:password@localhost:27017/back-shop?authSource=admin
```

### MongoDB Atlas (Cloud)
```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/back-shop?retryWrites=true&w=majority
```

## Запуск

```bash
# Разработка
npm run start:dev

# Продакшн
npm run build
npm run start
```

## Доступные команды

- `npm run start` - запуск приложения
- `npm run start:dev` - запуск в режиме разработки с hot-reload
- `npm run build` - сборка проекта

## Структура проекта

```
src/
├── main.ts                    # Точка входа
├── app/                       # Основные файлы приложения
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── app.module.ts
├── common/                    # Общие компоненты
│   ├── decorators/
│   ├── filters/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
├── config/                     # Конфигурация
│   ├── app.config.ts
│   └── database.config.ts
└── modules/                    # Модули приложения
    └── users/
        ├── dto/
        ├── schemas/
        ├── users.controller.ts
        ├── users.service.ts
        └── users.module.ts
```

## API Endpoints

- `GET /api` - приветственное сообщение
- `GET /api/health` - проверка здоровья приложения
- `GET /api/docs` - Swagger документация

## Swagger документация

После запуска проекта Swagger UI доступен по адресу:
```
http://localhost:3000/api/docs
```

В Swagger документации вы можете:
- Просмотреть все доступные эндпоинты
- Протестировать API запросы
- Увидеть схемы данных (DTO)
- Проверить примеры запросов и ответов

## Переменные окружения

| Переменная | Описание | Значение по умолчанию |
|-----------|----------|----------------------|
| `PORT` | Порт сервера | `3000` |
| `NODE_ENV` | Окружение (development/production) | `development` |
| `MONGODB_URI` | URI подключения к MongoDB | `mongodb://localhost:27017/back-shop` |
