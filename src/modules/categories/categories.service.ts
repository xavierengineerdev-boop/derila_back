import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SlugUtil } from '../../common/utils/slug.util';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '../../common/exceptions';
import * as fs from 'fs';
import * as path from 'path';

export interface CategoryTreeItem {
  id: string;
  name: string;
  slug: string;
  parent: string | null;
  parentCategories: string[];
  order: number;
  isActive: boolean;
  description: string | null;
  image: string | null;
  icon: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  children?: CategoryTreeItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    let slug = createCategoryDto.slug;
    if (!slug) {
      slug = SlugUtil.generate(createCategoryDto.name);
    }

    const existingCategory = await this.categoryModel.findOne({ slug }).exec();
    if (existingCategory) {
      throw new ConflictException(`Category with slug "${slug}" already exists`);
    }

    if (!SlugUtil.isValid(slug)) {
      throw new BadRequestException('Invalid slug format');
    }

    if (createCategoryDto.parent) {
      const parent = await this.categoryModel
        .findById(createCategoryDto.parent)
        .exec();
      if (!parent) {
        throw new NotFoundException('Parent category', {
          id: createCategoryDto.parent,
        });
      }
    }

    // Проверяем существование дополнительных родительских категорий
    if (
      createCategoryDto.parentCategories &&
      createCategoryDto.parentCategories.length > 0
    ) {
      const parentCategories = await this.categoryModel
        .find({
          _id: { $in: createCategoryDto.parentCategories },
        })
        .exec();

      if (parentCategories.length !== createCategoryDto.parentCategories.length) {
        throw new NotFoundException('Some parent categories not found');
      }
    }

    const category = new this.categoryModel({
      ...createCategoryDto,
      slug,
      parent: createCategoryDto.parent
        ? new Types.ObjectId(createCategoryDto.parent)
        : null,
      parentCategories: createCategoryDto.parentCategories
        ? createCategoryDto.parentCategories.map(
            (id) => new Types.ObjectId(id),
          )
        : [],
    });

    return category.save();
  }

  async findAll(includeInactive: boolean = false): Promise<Category[]> {
    const query = includeInactive ? {} : { isActive: true };
    return this.categoryModel
      .find(query)
      .sort({ order: 1, createdAt: 1 })
      .exec();
  }

  async findMainCategories(
    includeInactive: boolean = false,
  ): Promise<Category[]> {
    const query: any = { parent: null };
    if (!includeInactive) {
      query.isActive = true;
    }
    return this.categoryModel.find(query).sort({ order: 1 })      .exec();
  }

  async findSubCategories(
    parentId: string,
    includeInactive: boolean = false,
  ): Promise<Category[]> {
    const query: any = {
      $or: [
        { parent: new Types.ObjectId(parentId) },
        { parentCategories: new Types.ObjectId(parentId) },
      ],
    };
    if (!includeInactive) {
      query.isActive = true;
    }
    return this.categoryModel.find(query).sort({ order: 1 })      .exec();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Category', { id });
    }
    return category;
  }

  /**
   * Получить категорию по slug
   */
  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryModel.findOne({ slug }).exec();
    if (!category) {
      throw new NotFoundException('Category', { slug });
    }
    return category;
  }

  /**
   * Поиск категорий по названию
   */
  async search(query: string, includeInactive: boolean = false): Promise<Category[]> {
    const searchQuery: any = {
      name: { $regex: query, $options: 'i' },
    };
    if (!includeInactive) {
      searchQuery.isActive = true;
    }
    return this.categoryModel.find(searchQuery).sort({ order: 1 }).exec();
  }

  /**
   * Обновление категории
   */
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Category', { id });
    }

    // Если обновляется slug, проверяем уникальность
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingCategory = await this.categoryModel
        .findOne({ slug: updateCategoryDto.slug })
        .exec();
      if (existingCategory) {
        throw new ConflictException(
          `Category with slug "${updateCategoryDto.slug}" already exists`,
        );
      }

      if (!SlugUtil.isValid(updateCategoryDto.slug)) {
        throw new BadRequestException('Invalid slug format');
      }
    }

    // Если обновляется название и slug не указан, генерируем новый slug
    if (updateCategoryDto.name && !updateCategoryDto.slug) {
      const newSlug = SlugUtil.generate(updateCategoryDto.name);
      if (newSlug !== category.slug) {
        const existingCategory = await this.categoryModel
          .findOne({ slug: newSlug })
          .exec();
        if (!existingCategory) {
          updateCategoryDto.slug = newSlug;
        }
      }
    }

    // Проверяем существование родителя
    if (updateCategoryDto.parent !== undefined) {
      if (updateCategoryDto.parent) {
        // Проверяем, что не устанавливаем себя как родителя
        if (updateCategoryDto.parent === id) {
          throw new BadRequestException(
            'Category cannot be its own parent',
          );
        }

        // Проверяем, что не создаем циклическую зависимость
        const wouldCreateCycle = await this.wouldCreateCycle(
          id,
          updateCategoryDto.parent,
        );
        if (wouldCreateCycle) {
          throw new BadRequestException(
            'Cannot create circular reference in category hierarchy',
          );
        }

        const parent = await this.categoryModel
          .findById(updateCategoryDto.parent)
          .exec();
        if (!parent) {
          throw new NotFoundException('Parent category', {
            id: updateCategoryDto.parent,
          });
        }
      }
    }

    // Проверяем существование дополнительных родительских категорий
    if (updateCategoryDto.parentCategories !== undefined) {
      if (updateCategoryDto.parentCategories.length > 0) {
        // Убираем текущую категорию из списка, если она там есть
        const filteredParents = updateCategoryDto.parentCategories.filter(
          (parentId) => parentId !== id,
        );

        const parentCategories = await this.categoryModel
          .find({
            _id: { $in: filteredParents },
          })
          .exec();

        if (parentCategories.length !== filteredParents.length) {
          throw new NotFoundException('Some parent categories not found');
        }

        updateCategoryDto.parentCategories = filteredParents;
      }
    }

    // Обновляем категорию
    if (updateCategoryDto.parent !== undefined) {
      updateCategoryDto.parent = updateCategoryDto.parent
        ? (new Types.ObjectId(updateCategoryDto.parent) as any)
        : null;
    }

    if (updateCategoryDto.parentCategories !== undefined) {
      updateCategoryDto.parentCategories = updateCategoryDto.parentCategories.map(
        (parentId) => new Types.ObjectId(parentId),
      ) as any;
    }

    return this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .exec();
  }

  /**
   * Удаление категории
   */
  async remove(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Category', { id });
    }

    // Проверяем, есть ли дочерние категории
    const children = await this.categoryModel
      .find({
        $or: [
          { parent: id },
          { parentCategories: new Types.ObjectId(id) },
        ],
      })
      .exec();

    if (children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with children. Please delete or move children first.',
      );
    }

    // Удаляем папку с изображениями категории
    const categoryImagePath = path.join('uploads', 'categories', id);
    if (fs.existsSync(categoryImagePath)) {
      fs.rmSync(categoryImagePath, { recursive: true, force: true });
    }

    return this.categoryModel.findByIdAndDelete(id).exec();
  }

  /**
   * Получить дерево категорий
   */
  async getTree(includeInactive: boolean = false): Promise<CategoryTreeItem[]> {
    const query = includeInactive ? {} : { isActive: true };
    const categories = await this.categoryModel
      .find(query)
      .sort({ order: 1, createdAt: 1 })
      .exec();

    return this.buildTree(categories);
  }

  /**
   * Получить дерево категорий начиная с определенной категории
   */
  async getTreeFromCategory(
    categoryId: string,
    includeInactive: boolean = false,
  ): Promise<CategoryTreeItem> {
    const category = await this.findOne(categoryId);
    const query: any = {
      $or: [
        { parent: new Types.ObjectId(categoryId) },
        { parentCategories: new Types.ObjectId(categoryId) },
      ],
    };
    if (!includeInactive) {
      query.isActive = true;
    }

    const children = await this.categoryModel
      .find(query)
      .sort({ order: 1 })
      .exec();

    const treeItem: CategoryTreeItem = {
      id: (category as any)._id.toString(),
      name: category.name,
      slug: category.slug,
      parent: category.parent ? category.parent.toString() : null,
      parentCategories: category.parentCategories
        ? category.parentCategories.map((id) => id.toString())
        : [],
      order: category.order,
      isActive: category.isActive,
      description: category.description,
      image: category.image,
      icon: category.icon,
      metaTitle: category.metaTitle,
      metaDescription: category.metaDescription,
      metaKeywords: category.metaKeywords,
      children: this.buildTree(children),
      createdAt: (category as any).createdAt,
      updatedAt: (category as any).updatedAt,
    };

    return treeItem;
  }

  /**
   * Построение дерева из плоского списка
   */
  private buildTree(categories: CategoryDocument[]): CategoryTreeItem[] {
    const categoryMap = new Map<string, CategoryTreeItem>();
    const rootCategories: CategoryTreeItem[] = [];

    // Создаем карту всех категорий
    categories.forEach((category) => {
      const categoryItem: CategoryTreeItem = {
        id: (category as any)._id.toString(),
        name: category.name,
        slug: category.slug,
        parent: category.parent ? category.parent.toString() : null,
        parentCategories: category.parentCategories
          ? category.parentCategories.map((id) => id.toString())
          : [],
        order: category.order,
        isActive: category.isActive,
        description: category.description,
        image: category.image,
        icon: category.icon,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        metaKeywords: category.metaKeywords,
        children: [],
        createdAt: (category as any).createdAt,
        updatedAt: (category as any).updatedAt,
      };
      categoryMap.set(categoryItem.id, categoryItem);
    });

    // Строим дерево
    categories.forEach((category) => {
      const categoryItem = categoryMap.get(
        (category as any)._id.toString(),
      );
      if (category.parent) {
        const parent = categoryMap.get(category.parent.toString());
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(categoryItem);
        } else {
          // Если родитель не в списке, добавляем в корень
          rootCategories.push(categoryItem);
        }
      } else {
        rootCategories.push(categoryItem);
      }
    });

    // Сортируем детей по order
    const sortChildren = (items: CategoryTreeItem[]) => {
      items.sort((a, b) => a.order - b.order);
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          sortChildren(item.children);
        }
      });
    };

    sortChildren(rootCategories);

    return rootCategories;
  }

  /**
   * Проверка на создание циклической зависимости
   */
  private async wouldCreateCycle(
    categoryId: string,
    newParentId: string,
  ): Promise<boolean> {
    let currentParentId = newParentId;

    while (currentParentId) {
      if (currentParentId === categoryId) {
        return true;
      }

      const parent = await this.categoryModel.findById(currentParentId).exec();
      if (!parent || !parent.parent) {
        break;
      }

      currentParentId = parent.parent.toString();
    }

    return false;
  }

  /**
   * Получить все категории с пагинацией
   */
  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    includeInactive: boolean = false,
  ) {
    const query = includeInactive ? {} : { isActive: true };
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      this.categoryModel
        .find(query)
        .sort({ order: 1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.categoryModel.countDocuments(query).exec(),
    ]);

    return {
      data: categories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Массовое обновление порядка категорий
   */
  async updateOrder(updates: { id: string; order: number }[]): Promise<void> {
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(update.id) },
        update: { $set: { order: update.order } },
      },
    }));

    await this.categoryModel.bulkWrite(bulkOps);
  }

  /**
   * Получить статистику по категориям
   */
  async getStatistics() {
    const [total, active, inactive, withChildren, mainCategories] =
      await Promise.all([
        this.categoryModel.countDocuments().exec(),
        this.categoryModel.countDocuments({ isActive: true }).exec(),
        this.categoryModel.countDocuments({ isActive: false }).exec(),
        this.categoryModel
          .countDocuments({ parent: { $ne: null } })
          .exec(),
        this.categoryModel.countDocuments({ parent: null }).exec(),
      ]);

    return {
      total,
      active,
      inactive,
      withChildren,
      mainCategories,
      subCategories: total - mainCategories,
    };
  }
}

