import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import { PoolClient } from 'pg';
import { Express } from 'express';

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
    documents: any[],
    files: Express.Multer.File[],
  ) {
    const client = await this.dbService.getClient();

    try {
      // ===========================
      // START TRANSACTION
      // ===========================

      await client.query('BEGIN');

      // ===========================
      // DEPARTMENT VALIDATION
      // ===========================

      const departmentResult = await client.query(
        `
        SELECT department_code
        FROM departments
        WHERE id = $1;
        `,
        [employeeData.departmentId],
      );

      if (departmentResult.rows.length === 0) {
        throw new NotFoundException('Department not found');
      }

      // ===========================
      // DESIGNATION VALIDATION
      // ===========================

      const designationResult = await client.query(
        `
        SELECT id
        FROM designations
        WHERE id = $1;
        `,
        [employeeData.designationId],
      );

      if (designationResult.rows.length === 0) {
        throw new NotFoundException('Designation not found');
      }

      // ===========================
      // GENERATE EMPLOYEE CODE
      // ===========================

      const departmentCode = departmentResult.rows[0].department_code;

      const employeeCode = await this.generateEmployeeCode(
        client,
        departmentCode,
      );

      // ===========================
      // INSERT EMPLOYEE
      // ===========================

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
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14
        )
        RETURNING id, employee_code;
        `,
        [
          employeeCode,
          employeeData.firstName,
          employeeData.lastName,
          employeeData.email,
          employeeData.phone,
          employeeData.gender,
          employeeData.dob,
          employeeData.joiningDate,
          employeeData.departmentId,
          employeeData.designationId,
          employeeData.managerId,
          employeeData.employmentType,
          employeeData.workLocation,
          employeeData.status ?? 'Active',
        ],
      );

      const employeeId = employeeResult.rows[0].id;

      // ===========================
      // INSERT PERSONAL INFORMATION
      // ===========================

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

          personalInfo.fatherName,
          personalInfo.fatherAadhaarNumber,

          personalInfo.motherName,
          personalInfo.motherAadhaarNumber,

          personalInfo.maritalStatus,
          personalInfo.nationality,
          personalInfo.bloodGroup,

          personalInfo.emergencyContactName,
          personalInfo.emergencyContactNumber,
          personalInfo.emergencyContactRelation,
        ],
      );
      console.log('========== PERSONAL INFO ==========');
console.log(personalInfo);
      // ===========================
      // INSERT CURRENT ADDRESS
      // ===========================

      const currentAddress = addresses.currentAddress;

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
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        );
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

      // ===========================
      // INSERT PERMANENT ADDRESS
      // ===========================

      const permanentAddress = addresses.sameAsCurrentAddress
        ? currentAddress
        : addresses.permanentAddress;

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
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        );
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

      if (!Array.isArray(documents)) {
        throw new BadRequestException('Documents metadata must be an array');
      }

      if (!Array.isArray(files)) {
        throw new BadRequestException('Document files must be an array');
      }

      // Metadata count must match uploaded files count

      if (documents.length !== files.length) {
        throw new BadRequestException(
          'Documents metadata count must match files count',
        );
      }

      // ===========================
      // RESUME VALIDATION
      // ===========================

      const resumeCount = documents.filter(
        (document) => document.documentKey === 'RESUME',
      ).length;

      if (resumeCount > 1) {
        throw new BadRequestException(
          'Only one resume is allowed per employee',
        );
      }

      // ===========================
      // INSERT DOCUMENTS
      // ===========================

      for (const document of documents) {
        const documentKey = document.documentKey as DocumentKey;

        const definition = DOCUMENT_DEFINITIONS[documentKey];

        // Validate document key

        if (!definition) {
          throw new BadRequestException(
            `Invalid document key: ${document.documentKey}`,
          );
        }

        // Validate filename

        if (!document.fileName) {
          throw new BadRequestException(
            `File name is required for ${document.documentKey}`,
          );
        }

        // Find corresponding uploaded file

        const file = files.find(
          (uploadedFile) =>
            uploadedFile.originalname.toLowerCase() ===
            document.fileName.toLowerCase(),
        );

        if (!file) {
          throw new BadRequestException(
            `Uploaded file not found for ${document.fileName}`,
          );
        }

        // ===========================
        // INSERT DOCUMENT RECORD
        // ===========================

        await client.query(
          `
  INSERT INTO employee_documents (
    employee_id,
    document_name,
    document_type,
    original_file_name,
    file_path
  )
  VALUES (
    $1, $2, $3, $4, $5
  );
  `,
          [
            employeeId,
            definition.name,
            definition.type,
            file.originalname,
            file.path,
          ],
        );
      }

      // ===========================
      // COMMIT TRANSACTION
      // ===========================

      await client.query('COMMIT');

      return {
        message: 'Employee registered successfully',
        employeeId,
        employeeCode: employeeResult.rows[0].employee_code,
      };
    } catch (error) {
      // ===========================
      // ROLLBACK TRANSACTION
      // ===========================

      await client.query('ROLLBACK');

      throw error;
    } finally {
      // ===========================
      // RELEASE DATABASE CONNECTION
      // ===========================

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

      sequenceNumber = lastSequence + 1;
    }

    const formattedSequence = sequenceNumber.toString().padStart(4, '0');

    return `${departmentCode}-${currentYear}-${formattedSequence}`;
  }

  // ===========================
  // UPDATE EMPLOYEE
  // ===========================

  async update(id: string, employee: any) {
    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      dob,
      joiningDate,
      departmentId,
      designationId,
      managerId,
      employmentType,
    } = employee;

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

    const departmentResult = await this.dbService.query(
      `
        SELECT *
        FROM departments
        WHERE id = $1;
        `,
      [departmentId],
    );

    if (departmentResult.rows.length === 0) {
      throw new NotFoundException('Department not found');
    }

    const designationResult = await this.dbService.query(
      `
        SELECT *
        FROM designations
        WHERE id = $1;
        `,
      [designationId],
    );

    if (designationResult.rows.length === 0) {
      throw new NotFoundException('Designation not found');
    }

    const result = await this.dbService.query(
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
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *;
        `,
      [
        firstName,
        lastName,
        email,
        phone,
        gender,
        dob,
        joiningDate,
        departmentId,
        designationId,
        managerId,
        employmentType,
        id,
      ],
    );

    return result.rows[0];
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
}
