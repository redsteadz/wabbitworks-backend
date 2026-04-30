const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const multer = require('multer');

const ApiError = require('../../utils/ApiError');

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'avatars');
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const ALLOWED_MIME_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/avif', '.avif'],
]);

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AVATAR_SIZE_BYTES,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(ApiError.badRequest('Avatar image must be a PNG, JPG, WEBP, GIF, or AVIF file'));
    }

    cb(null, true);
  },
});

const ensureUploadDir = async () => {
  await fs.mkdir(UPLOAD_ROOT, { recursive: true });
};

const getAvatarExtension = (file) => {
  const mimeExtension = ALLOWED_MIME_TYPES.get(file.mimetype);
  if (mimeExtension) {
    return mimeExtension;
  }

  const originalExtension = path.extname(file.originalname || '').toLowerCase();
  if (originalExtension === '.jpeg') {
    return '.jpg';
  }

  if (ALLOWED_EXTENSIONS.has(originalExtension)) {
    return originalExtension;
  }

  return '.png';
};

const getBaseUrl = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : req.protocol;
  return `${protocol}://${req.get('host')}`;
};

const buildAvatarUrl = (req, filename) => {
  return `${getBaseUrl(req)}/uploads/avatars/${filename}`;
};

const storeAvatarFile = async (file, req) => {
  if (!file) {
    throw ApiError.badRequest('Avatar image file is required');
  }

  await ensureUploadDir();

  const extension = getAvatarExtension(file);
  const filename = `${crypto.randomUUID()}${extension}`;
  const filePath = path.join(UPLOAD_ROOT, filename);

  await fs.writeFile(filePath, file.buffer);

  return {
    filename,
    filePath,
    avatarUrl: buildAvatarUrl(req, filename),
  };
};

const isStoredAvatarUrl = (avatarUrl) => {
  if (typeof avatarUrl !== 'string' || avatarUrl.length === 0) {
    return false;
  }

  try {
    const pathname = new URL(avatarUrl, 'http://localhost').pathname;
    return pathname.startsWith('/uploads/avatars/');
  } catch (error) {
    return false;
  }
};

const resolveStoredAvatarPath = (avatarUrl) => {
  if (!isStoredAvatarUrl(avatarUrl)) {
    return null;
  }

  try {
    const pathname = new URL(avatarUrl, 'http://localhost').pathname;
    return path.join(process.cwd(), pathname.replace(/^\//, '').split('/').join(path.sep));
  } catch (error) {
    return null;
  }
};

const deleteStoredAvatar = async (avatarUrl) => {
  const filePath = resolveStoredAvatarPath(avatarUrl);
  if (!filePath) {
    return false;
  }

  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
};

module.exports = {
  avatarUpload,
  storeAvatarFile,
  deleteStoredAvatar,
  isStoredAvatarUrl,
};
