import { diskStorage, memoryStorage } from 'multer';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

// =====================================================
// EXISTING CONFIG
// Used by the current Employee API
// Stores uploaded files in /uploads
// =====================================================

export const multerConfig: MulterOptions = {
  storage: diskStorage({
    destination: './uploads',

    filename: (req, file, callback) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

      callback(null, `${uniqueName}-${file.originalname}`);
    },
  }),
};
// =====================================================
// NEW CONFIG
// Used by Employee Test API
// Stores files temporarily in memory
// file.buffer will be available
// =====================================================

export const multerMemoryConfig: MulterOptions = {
  storage: memoryStorage(),
};
