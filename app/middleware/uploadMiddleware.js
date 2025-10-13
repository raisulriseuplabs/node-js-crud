import multer from 'multer';
import path from 'path';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function dynamicStorage(subfolder = 'avatars') {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(process.cwd(), 'uploads', subfolder));
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      // Use employee id if available, else fallback to timestamp
      const id = req.params?.id || 'file';
      const filename = `${subfolder}_${id}_${Date.now()}${ext}`;
      cb(null, filename);
    }
  });
}

export function imageUpload(subfolder = 'avatars') {
  return multer({
    storage: dynamicStorage(subfolder),
    limits: { fileSize: MAX_IMAGE_SIZE },
    fileFilter: (req, file, cb) => {
      if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed (jpg, png, webp).'));
      }
    }
  }).single('avatar');
}

export function fileUpload(subfolder = 'files') {
  return multer({
    storage: dynamicStorage(subfolder),
    limits: { fileSize: MAX_FILE_SIZE },
  }).single('file');
}
