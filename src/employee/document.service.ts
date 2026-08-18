import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import {
  EmployeeUploadedFiles,
  matchDocumentFiles,
  validateDocumentMetadata,
  validateSingleDocumentDuplicates,
} from '../common/document-upload';
import {
  DOCUMENT_DEFINITIONS,
  DocumentKey,
} from './constants/document.constants';
import { validateUploadedFile } from '../common/file-validation';

@Injectable()
export class DocumentService {
  constructor(private readonly dbService: DbService) {}

  async upload(
    employeeId: number,
    documents: unknown,
    files: EmployeeUploadedFiles,
  ) {
    await this.ensureEmployeeExists(employeeId);
    validateDocumentMetadata(documents);

    if (documents.length === 0) {
      throw new BadRequestException('At least one document is required');
    }

    validateSingleDocumentDuplicates(documents);

    const matches = matchDocumentFiles(documents, files);
    for (const { document, file } of matches) {
      validateUploadedFile(file, document.documentKey);
    }

    const client = await this.dbService.getClient();

    try {
      await client.query('BEGIN');

      const storedDocuments: Array<{
        id: number;
        employeeId: number;
        documentName: string;
        documentType: string;
        originalFileName: string;
        mimeType: string;
        fileSize: number;
        uploadedAt: unknown;
      }> = [];

      for (const { document, file } of matches) {
        const definition = DOCUMENT_DEFINITIONS[document.documentKey];

        const result = await client.query(
          `
          INSERT INTO employee_documents (
            employee_id, document_name, document_type, original_file_name, mime_type, file_data
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, employee_id, document_name, document_type,
                    original_file_name, mime_type,
                    OCTET_LENGTH(file_data) AS file_size, uploaded_at;
          `,
          [
            employeeId,
            definition.name,
            definition.type,
            file.originalname,
            file.mimetype,
            file.buffer,
          ],
        );

        const row = result.rows[0];
        storedDocuments.push({
          id: row.id,
          employeeId: row.employee_id,
          documentName: row.document_name,
          documentType: row.document_type,
          originalFileName: row.original_file_name,
          mimeType: row.mime_type,
          fileSize: Number(row.file_size),
          uploadedAt: row.uploaded_at,
        });
      }

      await client.query('COMMIT');

      return {
        message: 'Documents uploaded successfully',
        employeeId,
        documentsStored: storedDocuments.length,
        documents: storedDocuments,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getEmployeeDocuments(employeeId: number) {
    await this.ensureEmployeeExists(employeeId);

    const result = await this.dbService.query(
      `
      SELECT
        id,
        employee_id,
        document_name,
        document_type,
        original_file_name,
        mime_type,
        OCTET_LENGTH(file_data) AS file_size,
        uploaded_at
      FROM employee_documents
      WHERE employee_id = $1
      ORDER BY uploaded_at DESC, id DESC;
      `,
      [employeeId],
    );

    return result.rows.map((document) => ({
      id: document.id,
      employeeId: document.employee_id,
      documentName: document.document_name,
      documentType: document.document_type,
      originalFileName: document.original_file_name,
      mimeType: document.mime_type,
      fileSize: Number(document.file_size),
      uploadedAt: document.uploaded_at,
    }));
  }

  async getDocument(documentId: number) {
    const result = await this.dbService.query(
      `
      SELECT id, employee_id, original_file_name, mime_type, file_data
      FROM employee_documents
      WHERE id = $1;
      `,
      [documentId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Document not found');
    }

    const document = result.rows[0];

    return {
      id: document.id,
      employeeId: document.employee_id,
      originalFileName: document.original_file_name,
      mimeType: document.mime_type,
      fileData: document.file_data,
    };
  }

  async updateDocument(
    documentId: number,
    documentData: { documentName?: string; documentType?: string },
  ) {
    const existing = await this.dbService.query(
      `SELECT id FROM employee_documents WHERE id = $1;`,
      [documentId],
    );

    if (existing.rows.length === 0) {
      throw new NotFoundException('Document not found');
    }

    const result = await this.dbService.query(
      `
      UPDATE employee_documents
      SET
        document_name = COALESCE($1, document_name),
        document_type = COALESCE($2, document_type)
      WHERE id = $3
      RETURNING
        id,
        employee_id,
        document_name,
        document_type,
        original_file_name,
        mime_type,
        OCTET_LENGTH(file_data) AS file_size,
        uploaded_at;
      `,
      [
        documentData.documentName ?? null,
        documentData.documentType ?? null,
        documentId,
      ],
    );

    const document = result.rows[0];

    return {
      message: 'Document updated successfully',
      document: {
        id: document.id,
        employeeId: document.employee_id,
        documentName: document.document_name,
        documentType: document.document_type,
        originalFileName: document.original_file_name,
        mimeType: document.mime_type,
        fileSize: Number(document.file_size),
        uploadedAt: document.uploaded_at,
      },
    };
  }

  async deleteDocument(documentId: number) {
    const result = await this.dbService.query(
      `
      DELETE FROM employee_documents
      WHERE id = $1
      RETURNING id, employee_id, document_name, original_file_name;
      `,
      [documentId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Document not found');
    }

    const document = result.rows[0];

    return {
      message: 'Document deleted successfully',
      document: {
        id: document.id,
        employeeId: document.employee_id,
        documentName: document.document_name,
        originalFileName: document.original_file_name,
      },
    };
  }

  private async ensureEmployeeExists(employeeId: number) {
    const result = await this.dbService.query(
      `SELECT id FROM employees WHERE id = $1;`,
      [employeeId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Employee not found');
    }
  }
}
