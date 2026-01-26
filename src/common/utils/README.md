# Утилиты для обработки ошибок

## Обзор

Универсальная система обработки ошибок для проекта, которая позволяет создавать стандартизированные ошибки с различными HTTP статус-кодами без дублирования кода.

## Структура

- `error.util.ts` - основная утилита для работы с ошибками
- `error.util.spec.ts` - примеры использования
- `../exceptions/custom-exceptions.ts` - классы исключений для разных статус-кодов

## Использование

### 1. Импорт исключений

```typescript
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from '../../common/exceptions';
```

### 2. Использование в сервисах

```typescript
// 404 - Not Found
if (!user) {
  throw new NotFoundException('User', { id });
}

// 409 - Conflict
if (existingUser) {
  throw new ConflictException('User already exists');
}

// 400 - Bad Request
if (!isValid) {
  throw new BadRequestException('Invalid data', validationErrors);
}

// 401 - Unauthorized
if (!isAuthenticated) {
  throw new UnauthorizedException('Invalid credentials');
}

// 403 - Forbidden
if (!hasPermission) {
  throw new ForbiddenException('Access denied');
}

// 500 - Internal Server Error
try {
  // some operation
} catch (error) {
  throw new InternalServerErrorException('Operation failed', error);
}
```

### 3. Универсальный метод

```typescript
import { ErrorUtil } from '../../common/utils/error.util';

// Создание ошибки с любым статус-кодом
throw ErrorUtil.createError(418, 'I\'m a teapot', 'Teapot Error');
```

### 4. Форматирование ответа

```typescript
const errorResponse = ErrorUtil.formatErrorResponse(
  404,
  'Resource not found',
  '/api/users/123',
  { id: '123' }
);
```

## Доступные классы исключений

### 4xx - Client Errors
- `BadRequestException` (400)
- `UnauthorizedException` (401)
- `ForbiddenException` (403)
- `NotFoundException` (404)
- `ConflictException` (409)
- `UnprocessableEntityException` (422)
- `TooManyRequestsException` (429)

### 5xx - Server Errors
- `InternalServerErrorException` (500)
- `BadGatewayException` (502)
- `ServiceUnavailableException` (503)
- `GatewayTimeoutException` (504)

## Вспомогательные методы

```typescript
// Проверка типа ошибки
ErrorUtil.isClientError(404); // true
ErrorUtil.isServerError(500); // true
ErrorUtil.isSuccess(200); // true
ErrorUtil.isRedirect(301); // true

// Получение описания ошибки
ErrorUtil.getDefaultError(404); // 'Not Found'
```

## Формат ответа

Все ошибки возвращаются в едином формате:

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found",
  "timestamp": "2026-01-03T15:00:00.000Z",
  "path": "/api/users/123",
  "details": {
    "id": "123"
  }
}
```

## Преимущества

1. **Единый формат** - все ошибки имеют одинаковую структуру
2. **Типобезопасность** - TypeScript проверяет типы
3. **Переиспользование** - нет дублирования кода
4. **Расширяемость** - легко добавить новые типы ошибок
5. **Автоматическая обработка** - HttpExceptionFilter обрабатывает все исключения


