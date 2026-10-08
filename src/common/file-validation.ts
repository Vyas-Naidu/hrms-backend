import { BadRequestException } from '@nestjs/common';

const MB = 1024 * 1024;

const PROFILE_PHOTO_MAX_SIZE = 5 * MB;
const PDF_MAX_SIZE = 10 * MB;

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'] as const;

const PDF_MIME_TYPE = 'application/pdf';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'] as const;

const PDF_EXTENSION = '.pdf';

export function validateUploadedFile(
  file: Express.Multer.File,
  documentKey: string,
): void {
  if (!file) {
    throw new BadRequestException(
      `Uploaded file is missing for ${documentKey}`,
    );
  }

  // ==========================================
  // 1. EMPTY FILE VALIDATION
  // ==========================================

  if (!file.buffer || file.buffer.length === 0) {
    throw new BadRequestException(`Uploaded file is empty for ${documentKey}`);
  }

  const originalName = file.originalname.toLowerCase();

  const extension = originalName.substring(originalName.lastIndexOf('.'));

  // ==========================================
  // 2. PROFILE PHOTO VALIDATION
  // ==========================================

  if (documentKey === 'PROFILE_PHOTO') {
    if (!IMAGE_EXTENSIONS.includes(extension as any)) {
      throw new BadRequestException('Profile photo must be JPG, JPEG, or PNG');
    }

    if (!IMAGE_MIME_TYPES.includes(file.mimetype as any)) {
      throw new BadRequestException(
        'Profile photo must have a valid image MIME type',
      );
    }

    if (file.size > PROFILE_PHOTO_MAX_SIZE) {
      throw new BadRequestException('Profile photo must not exceed 5 MB');
    }

    validateImageSignature(file, extension);

    return;
  }

  // ==========================================
  // 3. PDF DOCUMENT VALIDATION
  // ==========================================

  if (extension !== PDF_EXTENSION) {
    throw new BadRequestException(`${documentKey} document must be a PDF file`);
  }

  if (file.mimetype !== PDF_MIME_TYPE) {
    throw new BadRequestException(
      `${documentKey} document must have MIME type application/pdf`,
    );
  }

  if (file.size > PDF_MAX_SIZE) {
    throw new BadRequestException(
      `${documentKey} document must not exceed 10 MB`,
    );
  }

  validatePdfSignature(file);
}

// ==========================================
// PDF SECURITY VALIDATION
// ==========================================

function validatePdfSignature(file: Express.Multer.File): void {
  const pdfHeader = file.buffer.subarray(0, 5).toString('ascii');

  if (pdfHeader !== '%PDF-') {
    throw new BadRequestException('Invalid PDF file content');
  }
}

// ==========================================
// IMAGE SECURITY VALIDATION
// ==========================================

function validateImageSignature(
  file: Express.Multer.File,
  extension: string,
): void {
  const buffer = file.buffer;

  // JPEG signature
  const isJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  // PNG signature
  const isPng =
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  if (extension === '.jpg' || extension === '.jpeg') {
    if (!isJpeg) {
      throw new BadRequestException('Invalid JPEG file content');
    }

    return;
  }

  if (extension === '.png') {
    if (!isPng) {
      throw new BadRequestException('Invalid PNG file content');
    }

    return;
  }

  throw new BadRequestException('Invalid image file');
}
