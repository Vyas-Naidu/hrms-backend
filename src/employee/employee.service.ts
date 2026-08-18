import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import { PoolClient } from 'pg';
import {
  EmployeeUploadedFiles,
  matchDocumentFiles,
  validateDocumentMetadata,
  validateSingleDocumentDuplicates,
} from '../common/document-upload';
import { validateUploadedFile } from '../common/file-validation';
import {
  DOCUMENT_DEFINITIONS,
  DocumentKey,
} from './constants/document.constants';

@Injectable()
export class EmployeeService {
  constructor(private readonly dbService: DbService) {}

  // ===========================
  // GET ALL EMPLOYEES
  // ===========================

  async findAll() {
    const result = await this.dbService.query(`
      SELECT
        e.*,
        d.department_name,
        dg.designation_name
      FROM employees e
      LEFT JOIN departments d
        ON e.department_id = d.id
      LEFT JOIN designations dg
        ON e.designation_id = dg.id
      ORDER BY e.id;
    `);

    return result.rows;
  }

  // ===========================
  // GET EMPLOYEE BY ID
  // ===========================

  async findOne(id: string) {
    const result = await this.dbService.query(
      `
      SELECT
        e.*,
        d.department_name,
        dg.designation_name
      FROM employees e
      LEFT JOIN departments d
        ON e.department_id = d.id
      LEFT JOIN designations dg
        ON e.designation_id = dg.id
      WHERE e.id = $1;
      `,
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Employee not found');
    }

    return result.rows[0];
  }

  // ===========================
  // CREATE EMPLOYEE
  // ===========================

  async create(
    employeeData: any,
    personalInfo: any,
    addresses: any,
    documents: unknown,
    files: EmployeeUploadedFiles,
  ) {
    const normalizedEmployee = this.normalizeEmployeeData(employeeData);

    const client = await this.dbService.getClient();

    try {
      await client.query('BEGIN');

      // ---------------------------
      // Validate department
      // ---------------------------

      const departmentResult = await client.query(
        `
        SELECT department_code
        FROM departments
        WHERE id = $1;
        `,
        [normalizedEmployee.departmentId],
      );

      if (departmentResult.rows.length === 0) {
        throw new NotFoundException('Department not found');
      }

      // ---------------------------
      // Validate designation
      // ---------------------------

      const designationResult = await client.query(
        `
        SELECT id
        FROM designations
        WHERE id = $1;
        `,
        [normalizedEmployee.designationId],
      );

      if (designationResult.rows.length === 0) {
        throw new NotFoundException('Designation not found');
      }

      // ---------------------------
      // Generate employee code
      // ---------------------------

      const employeeCode = await this.generateEmployeeCode(
        client,
        departmentResult.rows[0].department_code,
      );

      // ---------------------------
      // Create employee
      // ---------------------------

      const employeeResult = await client.query(
        `
        INSERT INTO employees (
          employee_code,
          first_name,
          last_name,
          email,
          phone,
          gender,
          dob,
          joining_date,
          department_id,
          designation_id,
          manager_id,
          employment_type,
          work_location,
          status
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14
        )
        RETURNING id, employee_code;
        `,
        [
          employeeCode,
          normalizedEmployee.firstName,
          normalizedEmployee.lastName,
          normalizedEmployee.email,
          normalizedEmployee.phone,
          normalizedEmployee.gender,
          normalizedEmployee.dob,
          normalizedEmployee.joiningDate,
          normalizedEmployee.departmentId,
          normalizedEmployee.designationId,
          normalizedEmployee.managerId,
          normalizedEmployee.employmentType,
          normalizedEmployee.workLocation,
          normalizedEmployee.status ?? 'Active',
        ],
      );

      const employeeId = employeeResult.rows[0].id;

      // ---------------------------
      // Personal information
      // ---------------------------

      await client.query(
        `
        INSERT INTO employee_personal_info (
          employee_id,
          father_name,
          father_aadhaar_number,
          mother_name,
          mother_aadhaar_number,
          marital_status,
          nationality,
          blood_group,
          emergency_contact_name,
          emergency_contact_number,
          emergency_contact_relation
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11
        );
        `,
        [
          employeeId,
          personalInfo?.fatherName,
          personalInfo?.fatherAadhaarNumber,
          personalInfo?.motherName,
          personalInfo?.motherAadhaarNumber,
          personalInfo?.maritalStatus,
          personalInfo?.nationality,
          personalInfo?.bloodGroup,
          personalInfo?.emergencyContactName,
          personalInfo?.emergencyContactNumber,
          personalInfo?.emergencyContactRelation,
        ],
      );

      // ---------------------------
      // Address validation
      // ---------------------------

      const { currentAddress, permanentAddress } =
        this.resolveAddresses(addresses);

      // ---------------------------
      // Current address
      // ---------------------------

      await client.query(
        `
        INSERT INTO employee_addresses (
          employee_id,
          address_type,
          house_no,
          street,
          city,
          state,
          pincode,
          country
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `,
        [
          employeeId,
          'Current',
          currentAddress.houseNo,
          currentAddress.street,
          currentAddress.city,
          currentAddress.state,
          currentAddress.pincode,
          currentAddress.country,
        ],
      );

      // ---------------------------
      // Permanent address
      // ---------------------------

      await client.query(
        `
        INSERT INTO employee_addresses (
          employee_id,
          address_type,
          house_no,
          street,
          city,
          state,
          pincode,
          country
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `,
        [
          employeeId,
          'Permanent',
          permanentAddress.houseNo,
          permanentAddress.street,
          permanentAddress.city,
          permanentAddress.state,
          permanentAddress.pincode,
          permanentAddress.country,
        ],
      );

      // ===========================
      // DOCUMENT VALIDATION
      // ===========================

      validateDocumentMetadata(documents);

      if (documents.length === 0) {
        throw new BadRequestException(
          'Employee registration requires documents',
        );
      }

      validateSingleDocumentDuplicates(documents);

      const documentKeys = documents.map(
        (document) => document.documentKey as DocumentKey,
      );

      const hasDocument = (key: DocumentKey) => documentKeys.includes(key);

      // ---------------------------
      // Required documents
      // ---------------------------

      const requiredDocuments: DocumentKey[] = [
        'PROFILE_PHOTO',
        'AADHAAR',
        'PAN',
        'TENTH',
        'DEGREE',
        'RESUME',
      ];

      for (const key of requiredDocuments) {
        if (!hasDocument(key)) {
          throw new BadRequestException(
            `${DOCUMENT_DEFINITIONS[key].name} is required`,
          );
        }
      }

      // ---------------------------
      // Education path
      // ---------------------------

      const hasIntermediate = hasDocument('INTERMEDIATE');
      const hasDiploma = hasDocument('DIPLOMA');

      if (hasIntermediate && hasDiploma) {
        throw new BadRequestException(
          'Employee cannot have both Intermediate and Diploma certificates',
        );
      }

      if (!hasIntermediate && !hasDiploma) {
        throw new BadRequestException(
          'Either Intermediate or Diploma certificate is required',
        );
      }

      // ---------------------------
      // Match files to metadata
      // ---------------------------

      const matchedFiles = matchDocumentFiles(documents, files ?? {});

      // ---------------------------
      // Validate and store files
      // ---------------------------

      for (const { document, file } of matchedFiles) {
        validateUploadedFile(file, document.documentKey);

        const definition = DOCUMENT_DEFINITIONS[document.documentKey];

        await client.query(
          `
          INSERT INTO employee_documents (
            employee_id,
            document_name,
            document_type,
            original_file_name,
            mime_type,
            file_data
          )
          VALUES ($1, $2, $3, $4, $5, $6);
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
      }

      await client.query('COMMIT');

      return {
        message: 'Employee registered successfully',
        employeeId,
        employeeCode: employeeResult.rows[0].employee_code,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ===========================
  // GENERATE EMPLOYEE CODE
  // ===========================

  private async generateEmployeeCode(
    client: PoolClient,
    departmentCode: string,
  ): Promise<string> {
    const currentYear = new Date().getFullYear();

    const employeeResult = await client.query(
      `
      SELECT employee_code
      FROM employees
      WHERE employee_code LIKE $1
      ORDER BY id DESC
      LIMIT 1;
      `,
      [`${departmentCode}-${currentYear}-%`],
    );

    let sequenceNumber = 1;

    if (employeeResult.rows.length > 0) {
      const lastEmployeeCode = employeeResult.rows[0].employee_code;
      const lastSequence = Number(lastEmployeeCode.split('-')[2]);

      if (!Number.isNaN(lastSequence)) {
        sequenceNumber = lastSequence + 1;
      }
    }

    const formattedSequence = sequenceNumber.toString().padStart(4, '0');

    return `${departmentCode}-${currentYear}-${formattedSequence}`;
  }

  // ===========================
  // UPDATE EMPLOYEE
  // ===========================

  async update(id: string, employee: any) {
    // First fetch the existing employee.
    const existingResult = await this.dbService.query(
      `
      SELECT *
      FROM employees
      WHERE id = $1;
      `,
      [id],
    );

    if (existingResult.rows.length === 0) {
      throw new NotFoundException('Employee not found');
    }

    const existing = existingResult.rows[0];

    // Accept both:
    //
    // departmentId
    // department_id
    //
    // and the same pattern for other fields.
    const normalizedEmployee = this.normalizeEmployeeData(employee, existing);

    // ---------------------------
    // Validate department
    // ---------------------------

    const departmentResult = await this.dbService.query(
      `
      SELECT *
      FROM departments
      WHERE id = $1;
      `,
      [normalizedEmployee.departmentId],
    );

    if (departmentResult.rows.length === 0) {
      throw new NotFoundException('Department not found');
    }

    // ---------------------------
    // Validate designation
    // ---------------------------

    const designationResult = await this.dbService.query(
      `
      SELECT *
      FROM designations
      WHERE id = $1;
      `,
      [normalizedEmployee.designationId],
    );

    if (designationResult.rows.length === 0) {
      throw new NotFoundException('Designation not found');
    }

    // ---------------------------
    // Update employee
    // ---------------------------

    await this.dbService.query(
      `
      UPDATE employees
      SET
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        gender = $5,
        dob = $6,
        joining_date = $7,
        department_id = $8,
        designation_id = $9,
        manager_id = $10,
        employment_type = $11,
        work_location = $12,
        status = COALESCE($13, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14;
      `,
      [
        normalizedEmployee.firstName,
        normalizedEmployee.lastName,
        normalizedEmployee.email,
        normalizedEmployee.phone,
        normalizedEmployee.gender,
        normalizedEmployee.dob,
        normalizedEmployee.joiningDate,
        normalizedEmployee.departmentId,
        normalizedEmployee.designationId,
        normalizedEmployee.managerId,
        normalizedEmployee.employmentType,
        normalizedEmployee.workLocation,
        normalizedEmployee.status,
        id,
      ],
    );

    // Return the same relationship information that GET returns.
    const updatedResult = await this.dbService.query(
      `
      SELECT
        e.*,
        d.department_name,
        dg.designation_name
      FROM employees e
      LEFT JOIN departments d
        ON e.department_id = d.id
      LEFT JOIN designations dg
        ON e.designation_id = dg.id
      WHERE e.id = $1;
      `,
      [id],
    );

    return updatedResult.rows[0];
  }

  // ===========================
  // DELETE EMPLOYEE
  // ===========================

  async remove(id: string) {
    const employeeResult = await this.dbService.query(
      `
      SELECT *
      FROM employees
      WHERE id = $1;
      `,
      [id],
    );

    if (employeeResult.rows.length === 0) {
      throw new NotFoundException('Employee not found');
    }

    await this.dbService.query(
      `
      DELETE FROM employees
      WHERE id = $1;
      `,
      [id],
    );

    return {
      message: 'Employee deleted successfully',
    };
  }

  // ===========================
  // NORMALIZE EMPLOYEE DATA
  // ===========================

  private normalizeEmployeeData(employee: any, existing: any = {}) {
    const source = employee ?? {};

    return {
      firstName: source.firstName ?? source.first_name ?? existing.first_name,

      lastName: source.lastName ?? source.last_name ?? existing.last_name,

      email: source.email ?? existing.email,

      phone: source.phone ?? existing.phone,

      gender: source.gender ?? existing.gender,

      dob: this.normalizeDate(source.dob ?? existing.dob),

      joiningDate: this.normalizeDate(
        source.joiningDate ?? source.joining_date ?? existing.joining_date,
      ),

      departmentId:
        source.departmentId ?? source.department_id ?? existing.department_id,

      designationId:
        source.designationId ??
        source.designation_id ??
        existing.designation_id,

      managerId:
        source.managerId ?? source.manager_id ?? existing.manager_id ?? null,

      employmentType:
        source.employmentType ??
        source.employment_type ??
        existing.employment_type,

      workLocation:
        source.workLocation ?? source.work_location ?? existing.work_location,

      status: source.status ?? existing.status ?? 'Active',
    };
  }

  // ===========================
  // DATE NORMALIZATION
  // ===========================

  private normalizeDate(value: unknown): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    if (typeof value !== 'string') {
      return String(value);
    }

    // Preserve API date-only values exactly.
    //
    // Example:
    // "2001-07-21"
    // remains
    // "2001-07-21"
    //
    // This prevents an unnecessary timezone conversion.
    const dateOnlyMatch = value.match(/^(\d{4}-\d{2}-\d{2})$/);

    if (dateOnlyMatch) {
      return dateOnlyMatch[1];
    }

    // If an ISO timestamp is received, extract the date
    // portion instead of converting it through local timezone.
    const isoDateMatch = value.match(/^(\d{4}-\d{2}-\d{2})T/);

    if (isoDateMatch) {
      return isoDateMatch[1];
    }

    return value;
  }

  // ===========================
  // ADDRESS RESOLUTION
  // ===========================

  private resolveAddresses(addresses: any) {
    if (!addresses || typeof addresses !== 'object') {
      throw new BadRequestException('Addresses information is required');
    }

    const currentAddress = addresses.currentAddress;

    if (!currentAddress || typeof currentAddress !== 'object') {
      throw new BadRequestException('Current address is required');
    }

    const sameAsCurrentAddress = addresses.sameAsCurrentAddress === true;

    const permanentAddress = sameAsCurrentAddress
      ? currentAddress
      : addresses.permanentAddress;

    if (!permanentAddress || typeof permanentAddress !== 'object') {
      throw new BadRequestException(
        'Permanent address is required when sameAsCurrentAddress is false',
      );
    }

    this.validateAddressFields(currentAddress, 'Current address');

    this.validateAddressFields(permanentAddress, 'Permanent address');

    return {
      currentAddress,
      permanentAddress,
    };
  }

  // ===========================
  // ADDRESS FIELD VALIDATION
  // ===========================

  private validateAddressFields(address: any, addressLabel: string) {
    const requiredFields = [
      'houseNo',
      'street',
      'city',
      'state',
      'pincode',
      'country',
    ];

    for (const field of requiredFields) {
      const value = address?.[field];

      if (
        value === undefined ||
        value === null ||
        String(value).trim() === ''
      ) {
        throw new BadRequestException(`${addressLabel} ${field} is required`);
      }
    }
  }
}
