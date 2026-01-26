import { diskStorage, memoryStorage } from 'multer';
import { FileUtil } from '../../../common/utils/file.util';
import * as fs from 'fs';
import * as path from 'path';

// Memory storage для создания категории (когда ID еще неизвестен)
export const categoryImageMemoryStorage = memoryStorage();

// Disk storage для обновления категории (когда ID известен)
export const categoryImageDiskStorage = diskStorage({
  destination: (req, file, cb) => {
    const categoryId = req.params?.id;
    if (!categoryId) {
      return cb(new Error('Category ID is required'), null);
    }
    
    const uploadPath = path.join('uploads', 'categories', categoryId);
    
    // Создаем папку если не существует
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileName = FileUtil.generateFileName(file.originalname);
    cb(null, fileName);
  },
});

export const categoryImageFilter = (req, file, cb) => {
  if (FileUtil.isImage(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};
