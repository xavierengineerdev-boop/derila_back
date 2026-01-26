/**
 * Утилита для генерации slug из строки
 * Используется для создания URL-friendly идентификаторов
 */
export class SlugUtil {
  /**
   * Генерирует slug из строки
   * @param text - исходная строка
   * @returns slug в формате lowercase с дефисами
   * 
   * @example
   * SlugUtil.generate('Главная страница') // 'glavnaya-stranitsa'
   * SlugUtil.generate('About Us') // 'about-us'
   * SlugUtil.generate('Продукты & Услуги') // 'produkty-uslugi'
   */
  static generate(text: string): string {
    if (!text) {
      return '';
    }

    return text
      .toString()
      .toLowerCase()
      .trim()
      // Транслитерация кириллицы
      .replace(/[а-яё]/g, (char) => {
        const map: Record<string, string> = {
          а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e',
          ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
          н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
          ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
          ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
        };
        return map[char] || char;
      })
      // Замена специальных символов на дефисы
      .replace(/[^\w\s-]/g, '')
      // Замена пробелов и множественных дефисов на один дефис
      .replace(/[\s_-]+/g, '-')
      // Удаление дефисов в начале и конце
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Генерирует уникальный slug, добавляя суффикс если нужно
   * @param text - исходная строка
   * @param existingSlugs - массив существующих slug
   * @returns уникальный slug
   */
  static generateUnique(text: string, existingSlugs: string[] = []): string {
    let slug = this.generate(text);
    const baseSlug = slug;
    let counter = 1;

    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Валидация slug
   * @param slug - slug для проверки
   * @returns true если slug валидный
   */
  static isValid(slug: string): boolean {
    if (!slug) {
      return false;
    }

    // Разрешаем только латинские буквы, цифры и дефисы
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug) && slug.length >= 1 && slug.length <= 100;
  }
}


