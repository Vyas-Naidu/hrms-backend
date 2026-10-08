import { BadRequestException } from '@nestjs/common';
import { Express } from 'express';
import {
  DOCUMENT_DEFINITIONS,
  DocumentKey,
} from '../employee/constants/document.constants';

export type EmployeeUploadedFiles = {
  profilePhoto?: Express.Multer.File[];
  aadhaar?: Express.Multer.File[];
  pan?: Express.Multer.File[];
  drivingLicense?: Express.Multer.File[];
  education?: Express.Multer.File[];
  experience?: Express.Multer.File[];
  resume?: Express.Multer.File[];
};

export const DOCUMENT_UPLOAD_FIELDS: Record<
  DocumentKey,
  keyof EmployeeUploadedFiles
> = {
  PROFILE_PHOTO: 'profilePhoto',
  AADHAAR: 'aadhaar',
  PAN: 'pan',
  DRIVING_LICENSE: 'drivingLicense',
  TENTH: 'education',
  INTERMEDIATE: 'education',
  DIPLOMA: 'education',
  DEGREE: 'education',
  PG: 'education',
  EXPERIENCE: 'experience',
  RESUME: 'resume',
};

export const SINGLE_DOCUMENT_KEYS: DocumentKey[] = [
  'PROFILE_PHOTO',
  'AADHAAR',
  'PAN',
  'DRIVING_LICENSE',
  'TENTH',
  'INTERMEDIATE',
  'DIPLOMA',
  'DEGREE',
  'PG',
  'RESUME',
];

export function validateDocumentMetadata(
  documents: unknown,
): asserts documents is Array<{
  documentKey: DocumentKey;
  fileName: string;
}> {
  if (!Array.isArray(documents)) {
    throw new BadRequestException('Documents metadata must be an array');
  }

  for (const document of documents) {
    const documentKey = document?.documentKey as DocumentKey;
    const definition = DOCUMENT_DEFINITIONS[documentKey];

    if (!definition) {
      throw new BadRequestException(
        `Invalid document key: ${document?.documentKey}`,
      );
    }

    if (!document?.fileName || typeof document.fileName !== 'string') {
      throw new BadRequestException(
        `File name is required for ${document?.documentKey}`,
      );
    }
  }
}

export function validateSingleDocumentDuplicates(
  documents: Array<{ documentKey: DocumentKey }>,
): void {
  const counts = documents.reduce<Record<string, number>>(
    (result, document) => {
      result[document.documentKey] = (result[document.documentKey] ?? 0) + 1;
      return result;
    },
    {},
  );

  for (const key of SINGLE_DOCUMENT_KEYS) {
    if ((counts[key] ?? 0) > 1) {
      throw new BadRequestException(
        `Only one ${DOCUMENT_DEFINITIONS[key].name} is allowed`,
      );
    }
  }
}

export function getAvailableFiles(files: EmployeeUploadedFiles) {
  return Object.entries(files ?? {}).flatMap(([fieldName, fieldFiles]) =>
    (fieldFiles ?? []).map((file) => ({
      fieldName: fieldName as keyof EmployeeUploadedFiles,
      file,
      used: false,
    })),
  );
}

export function matchDocumentFiles(
  documents: Array<{ documentKey: DocumentKey; fileName: string }>,
  files: EmployeeUploadedFiles,
): Array<{
  document: { documentKey: DocumentKey; fileName: string };
  file: Express.Multer.File;
}> {
  const availableFiles = getAvailableFiles(files);
  const matches: Array<{
    document: { documentKey: DocumentKey; fileName: string };
    file: Express.Multer.File;
  }> = [];

  for (const document of documents) {
    const expectedField = DOCUMENT_UPLOAD_FIELDS[document.documentKey];

    const candidate = availableFiles.find(
      (entry) =>
        !entry.used &&
        entry.fieldName === expectedField &&
        entry.file.originalname === document.fileName,
    );

    if (!candidate) {
      throw new BadRequestException(
        `Uploaded file "${document.fileName}" was not found in field "${expectedField}" for ${document.documentKey}`,
      );
    }

    candidate.used = true;
    matches.push({ document, file: candidate.file });
  }

  const unusedFile = availableFiles.find((entry) => !entry.used);

  if (unusedFile) {
    throw new BadRequestException(
      `Uploaded file "${unusedFile.file.originalname}" does not have matching document metadata`,
    );
  }

  return matches;
}
