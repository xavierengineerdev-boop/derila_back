import { diskStorage, memoryStorage } from 'multer';
import { FileUtil } from '../../../common/utils/file.util';
import * as fs from 'fs';
import * as path from 'path';

// Memory storage для создания товара (когда ID еще неизвестен)
export const productImageMemoryStorage = memoryStorage();

// Disk storage для обновления товара (когда ID известен)
export const productImageDiskStorage = diskStorage({
  destination: (req, file, cb) => {
    const productId = req.params?.id;
    if (!productId) {
      return cb(new Error('Product ID is required'), null);
    }

    const uploadPath = path.join('uploads', 'products', productId);
    
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

export const productImageFilter = (req, file, cb) => {
  if (FileUtil.isImage(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};


