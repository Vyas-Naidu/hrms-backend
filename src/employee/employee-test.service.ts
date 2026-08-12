import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class EmployeeTestService {
  constructor(private readonly dbService: DbService) {}

  async register(
    employeeData: any,
    personalInfo: any,
    addresses: any,
    documentsMetadata: any[],
    files: {
      profilePhoto?: Express.Multer.File[];
      aadhaar?: Express.Multer.File[];
      pan?: Express.Multer.File[];
      passport?: Express.Multer.File[];
      drivingLicense?: Express.Multer.File[];
      education?: Express.Multer.File[];
      experience?: Express.Multer.File[];
      resume?: Express.Multer.File[];
    },
  ) {
    console.log('🔥 NEW EMPLOYEE TEST SERVICE IS RUNNING');

    /*
     * We need an existing employee ID because
     * employee_documents.employee_id is required.
     */
    const employeeId = employeeData.employeeId;

    if (!employeeId) {
      throw new NotFoundException(
        'employeeId is required for file storage testing',
      );
    }

    /*
     * Verify that the employee exists.
     */
    const employeeResult = await this.dbService.query(
      `
      SELECT id
      FROM employees
      WHERE id = $1;
      `,
      [employeeId],
    );

    if (employeeResult.rows.length === 0) {
      throw new NotFoundException('Employee not found');
    }

    /*
     * Get a dedicated database client.
     *
     * We use a client instead of separate dbService.query()
     * calls because we need a transaction.
     */
    const client = await this.dbService.getClient();

    try {
      /*
       * Start transaction.
       */
      await client.query('BEGIN');

      /*
       * Map frontend upload field names
       * to our database document information.
       */
      const documentMap: Record<
        string,
        {
          documentName: string;
          documentType: string;
        }
      > = {
        profilePhoto: {
          documentName: 'Profile Photo',
          documentType: 'PROFILE_PHOTO',
        },

        aadhaar: {
          documentName: 'Aadhaar Card',
          documentType: 'AADHAAR',
        },

        pan: {
          documentName: 'PAN Card',
          documentType: 'PAN',
        },

        passport: {
          documentName: 'Passport',
          documentType: 'PASSPORT',
        },

        drivingLicense: {
          documentName: 'Driving License',
          documentType: 'DRIVING_LICENSE',
        },

        education: {
          documentName: 'Educational Certificate',
          documentType: 'EDUCATION',
        },

        experience: {
          documentName: 'Experience Letter',
          documentType: 'EXPERIENCE',
        },

        resume: {
          documentName: 'Resume',
          documentType: 'RESUME',
        },
      };

      const storedDocuments: Array<{
        id: number;
        fieldName: string;
        documentName: string;
        documentType: string;
        originalFileName: string;
        mimeType: string;
        fileSize: number;
      }> = [];

      /*
       * Loop through every upload field.
       */
      for (const [fieldName, fieldFiles] of Object.entries(files)) {
        if (!fieldFiles || fieldFiles.length === 0) {
          continue;
        }

        const documentInfo = documentMap[fieldName];

        /*
         * Ignore unexpected fields for now.
         */
        if (!documentInfo) {
          console.log(`⚠️ Unknown file field: ${fieldName}`);
          continue;
        }

        /*
         * A field can contain multiple files.
         *
         * Example:
         *
         * education
         *   ├── 10th.pdf
         *   ├── intermediate.pdf
         *   └── degree.pdf
         */
        for (const file of fieldFiles) {
          console.log('📄 Storing file:', {
            fieldName,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            bufferSize: file.buffer.length,
          });

          /*
           * IMPORTANT:
           *
           * file.buffer is inserted directly into
           * PostgreSQL BYTEA.
           */
          const result = await client.query(
            `
            INSERT INTO employee_documents (
              employee_id,
              document_name,
              document_type,
              original_file_name,
              mime_type,
              file_data
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6
            )
            RETURNING id;
            `,
            [
              employeeId,
              documentInfo.documentName,
              documentInfo.documentType,
              file.originalname,
              file.mimetype,
              file.buffer,
            ],
          );

          storedDocuments.push({
            id: result.rows[0].id,
            fieldName,
            documentName: documentInfo.documentName,
            documentType: documentInfo.documentType,
            originalFileName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.buffer.length,
          });
        }
      }

      /*
       * Everything succeeded.
       *
       * Make all document inserts permanent.
       */
      await client.query('COMMIT');

      console.log(
        `✅ Successfully stored ${storedDocuments.length} document(s)`,
      );

      return {
        message: 'Employee registration file test successful',

        employeeId,

        employeeData,

        personalInfo,

        addresses,

        documentsMetadata,

        documentsStored: storedDocuments.length,

        files: storedDocuments,
      };
    } catch (error) {
      /*
       * If even one document fails,
       * remove all inserts from this request.
       */
      await client.query('ROLLBACK');

      console.error('❌ Document storage failed:', error);

      throw error;
    } finally {
      /*
       * Always release the PostgreSQL client.
       */
      client.release();
    }
  }
  async getDocument(documentId: number) {
    const result = await this.dbService.query(
      `
    SELECT
      id,
      employee_id,
      original_file_name,
      mime_type,
      file_data
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

  async getEmployeeDocuments(employeeId: number) {
    const employeeResult = await this.dbService.query(
      `
    SELECT id
    FROM employees
    WHERE id = $1;
    `,
      [employeeId],
    );

    if (employeeResult.rows.length === 0) {
      throw new NotFoundException('Employee not found');
    }

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

  async updateDocument(
    documentId: number,
    documentData: {
      documentName?: string;
      documentType?: string;
    },
  ) {
    const existingDocument = await this.dbService.query(
      `
    SELECT id
    FROM employee_documents
    WHERE id = $1;
    `,
      [documentId],
    );

    if (existingDocument.rows.length === 0) {
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
  async uploadDocuments(
    employeeId: number,
    files: {
      profilePhoto?: Express.Multer.File[];
      aadhaar?: Express.Multer.File[];
      pan?: Express.Multer.File[];
      passport?: Express.Multer.File[];
      drivingLicense?: Express.Multer.File[];
      education?: Express.Multer.File[];
      experience?: Express.Multer.File[];
      resume?: Express.Multer.File[];
    },
  ) {
    console.log('📁 DOCUMENT UPLOAD API');

    // ============================================================
    // VERIFY EMPLOYEE
    // ============================================================

    const employeeResult = await this.dbService.query(
      `
    SELECT id
    FROM employees
    WHERE id = $1;
    `,
      [employeeId],
    );

    if (employeeResult.rows.length === 0) {
      throw new NotFoundException('Employee not found');
    }

    // ============================================================
    // DATABASE CLIENT
    // ============================================================

    const client = await this.dbService.getClient();

    try {
      await client.query('BEGIN');

      // ============================================================
      // DOCUMENT FIELD → DATABASE INFORMATION
      // ============================================================

      const documentMap: Record<
        string,
        {
          documentName: string;
          documentType: string;
        }
      > = {
        profilePhoto: {
          documentName: 'Profile Photo',
          documentType: 'PROFILE_PHOTO',
        },

        aadhaar: {
          documentName: 'Aadhaar Card',
          documentType: 'AADHAAR',
        },

        pan: {
          documentName: 'PAN Card',
          documentType: 'PAN',
        },

        passport: {
          documentName: 'Passport',
          documentType: 'PASSPORT',
        },

        drivingLicense: {
          documentName: 'Driving License',
          documentType: 'DRIVING_LICENSE',
        },

        education: {
          documentName: 'Educational Certificate',
          documentType: 'EDUCATION',
        },

        experience: {
          documentName: 'Experience Letter',
          documentType: 'EXPERIENCE',
        },

        resume: {
          documentName: 'Resume',
          documentType: 'RESUME',
        },
      };

      // ============================================================
      // STORE FILES
      // ============================================================

      const storedDocuments: Array<{
        id: number;
        employeeId: number;
        documentName: string;
        documentType: string;
        originalFileName: string;
        mimeType: string;
        fileSize: number;
      }> = [];

      for (const [fieldName, fieldFiles] of Object.entries(files)) {
        if (!fieldFiles || fieldFiles.length === 0) {
          continue;
        }

        const documentInfo = documentMap[fieldName];

        if (!documentInfo) {
          continue;
        }

        for (const file of fieldFiles) {
          console.log('📄 Storing:', {
            fieldName,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            bufferSize: file.buffer.length,
          });

          const result = await client.query(
            `
          INSERT INTO employee_documents (
            employee_id,
            document_name,
            document_type,
            original_file_name,
            mime_type,
            file_data
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )
          RETURNING
            id,
            employee_id,
            document_name,
            document_type,
            original_file_name,
            mime_type,
            OCTET_LENGTH(file_data) AS file_size;
          `,
            [
              employeeId,
              documentInfo.documentName,
              documentInfo.documentType,
              file.originalname,
              file.mimetype,
              file.buffer,
            ],
          );

          const document = result.rows[0];

          storedDocuments.push({
            id: document.id,
            employeeId: document.employee_id,
            documentName: document.document_name,
            documentType: document.document_type,
            originalFileName: document.original_file_name,
            mimeType: document.mime_type,
            fileSize: Number(document.file_size),
          });
        }
      }

      // ============================================================
      // COMMIT
      // ============================================================

      await client.query('COMMIT');

      console.log(
        `✅ ${storedDocuments.length} document(s) stored successfully`,
      );

      return {
        message: 'Documents uploaded successfully',
        employeeId,
        documentsStored: storedDocuments.length,
        documents: storedDocuments,
      };
    } catch (error) {
      await client.query('ROLLBACK');

      console.error('❌ Document upload failed:', error);

      throw error;
    } finally {
      client.release();
    }
  }
  async deleteDocument(documentId: number) {
    const result = await this.dbService.query(
      `
    DELETE FROM employee_documents
    WHERE id = $1
    RETURNING
      id,
      employee_id,
      document_name,
      original_file_name;
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
}
