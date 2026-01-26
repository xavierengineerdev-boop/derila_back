import { extname } from 'path';

/**
 * Утилита для работы с файлами
 */
export class FileUtil {
  /**
   * Генерация уникального имени файла
   */
  static generateFileName(originalName: string): string {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(originalName);
    const nameWithoutExt = originalName.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '-');
    return `${nameWithoutExt}-${uniqueSuffix}${ext}`;
  }

  /**
   * Проверка типа файла (только изображения)
   */
  static isImage(mimetype: string): boolean {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return allowedMimes.includes(mimetype);
  }

  /**
   * Получение расширения файла
   */
  static getExtension(filename: string): string {
    return extname(filename).toLowerCase();
  }
}


