import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class DepartmentService {
  constructor(private readonly dbService: DbService) { }

  // CREATE
  async create(department: any) {
    const departmentName = (
      department?.departmentName ?? department?.department_name
    )?.trim();

    const departmentCode = (
      department?.departmentCode ?? department?.department_code
    )?.trim();

    const designations = Array.isArray(department?.designations)
      ? department.designations
        .map((name: any) => name?.trim())
        .filter(Boolean)
      : [];

    if (!departmentName) {
      throw new BadRequestException('Department name is required');
    }

    if (!departmentCode) {
      throw new BadRequestException('Department code is required');
    }
    const client = await this.dbService.getClient();

    try {
      await client.query('BEGIN');

      // ==========================================
      // CHECK DEPARTMENT CODE
      // ==========================================

      const codeResult = await client.query(
        `
      SELECT id
      FROM departments
      WHERE LOWER(TRIM(department_code)) = LOWER(TRIM($1))
      LIMIT 1;
      `,
        [departmentCode],
      );

      if (codeResult.rows.length > 0) {


        throw new ConflictException(
          'Department code already exists',
        );
      }

      // ==========================================
      // CHECK DEPARTMENT NAME
      // ==========================================

      const nameResult = await client.query(
        `
      SELECT id
      FROM departments
      WHERE LOWER(TRIM(department_name)) = LOWER(TRIM($1))
      LIMIT 1;
      `,
        [departmentName],
      );

      if (nameResult.rows.length > 0) {
        throw new ConflictException(
          'Department name already exists',
        );
      }

      // ==========================================
      // CREATE DEPARTMENT
      // ==========================================

      const departmentResult = await client.query(
        `
      INSERT INTO departments (
        department_name,
        department_code
      )
      VALUES ($1, $2)
      RETURNING *;
      `,
        [departmentName, departmentCode],
      );

      const departmentRow = departmentResult.rows[0];
      const departmentId = departmentRow.id;

      // ==========================================
      // CREATE DESIGNATIONS
      // ==========================================

      const createdDesignations: any[] = [];

      for (const designationName of designations) {
        const designationResult = await client.query(
          `
        INSERT INTO designations (
          designation_name,
          department_id
        )
        VALUES ($1, $2)
        RETURNING *;
        `,
          [designationName, departmentId],
        );

        createdDesignations.push(designationResult.rows[0]);
      }

      await client.query('COMMIT');

      return {
        department: departmentRow,
        designations: createdDesignations,
      };

    } catch (error: any) {
      await client.query('ROLLBACK');

      // If we already created a ConflictException,
      // send that exact message to frontend.
      if (error instanceof ConflictException) {
        throw error;
      }

      // PostgreSQL duplicate constraint
      if (error?.code === '23505') {

        if (
          error?.constraint ===
          'departments_department_code_key'
        ) {
          throw new ConflictException(
            'Department code already exists',
          );
        }

        if (
          error?.constraint ===
          'departments_department_name_key'
        ) {
          throw new ConflictException(
            'Department name already exists',
          );
        }

        if (
          error?.constraint ===
          'unique_department_designation'
        ) {
          throw new ConflictException(
            'Designation already exists in this department',
          );
        }

        throw new ConflictException(
          'Department already exists',
        );
      }

      throw error;

    } finally {
      client.release();
    }
  }

  // READ ALL
  async findAll() {
    const result = await this.dbService.query(
      `
      SELECT *
      FROM departments
      ORDER BY id;
      `,
    );

    return result.rows;
  }

  // READ ONE
  async findOne(id: string) {
    const result = await this.dbService.query(
      `
      SELECT *
      FROM departments
      WHERE id = $1;
      `,
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Department not found');
    }

    return result.rows[0];
  }

  // UPDATE
  async update(id: string, department: any) {
    const departmentName = (
      department?.departmentName ?? department?.department_name
    )
      ?.trim();

    const departmentCode = (
      department?.departmentCode ?? department?.department_code
    )
      ?.trim();

    if (!departmentName) {
      throw new BadRequestException('Department name is required');
    }

    if (!departmentCode) {
      throw new BadRequestException('Department code is required');
    }

    // Check duplicate department code
    const existingCode = await this.dbService.query(
      `
    SELECT id
    FROM departments
    WHERE LOWER(TRIM(department_code)) = LOWER(TRIM($1))
      AND id != $2
    LIMIT 1;
    `,
      [departmentCode, id],
    );

    if (existingCode.rows.length > 0) {
      throw new ConflictException(
        'Department code already exists',
      );
    }

    // Check duplicate department name
    const existingName = await this.dbService.query(
      `
    SELECT id
    FROM departments
    WHERE LOWER(TRIM(department_name)) = LOWER(TRIM($1))
      AND id != $2
    LIMIT 1;
    `,
      [departmentName, id],
    );

    if (existingName.rows.length > 0) {
      throw new ConflictException(
        'Department name already exists',
      );
    }

    try {
      const result = await this.dbService.query(
        `
      UPDATE departments
      SET
        department_name = $1,
        department_code = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
      `,
        [departmentName, departmentCode, id],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException(
          'Department not found',
        );
      }

      return result.rows[0];
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof ConflictException) {
        throw error;
      }

      if (error?.code === '23505') {
        if (
          error?.constraint ===
          'departments_department_code_key'
        ) {
          throw new ConflictException(
            'Department code already exists',
          );
        }

        throw new ConflictException(
          'Department name already exists',
        );
      }

      throw error;
    }
  }
  // DELETE
async remove(id: string) {
  const client = await this.dbService.getClient();

  try {
    await client.query('BEGIN');

    // ==========================================
    // CHECK DEPARTMENT EXISTS
    // ==========================================

    const departmentResult = await client.query(
      `
      SELECT id
      FROM departments
      WHERE id = $1;
      `,
      [id],
    );

    if (departmentResult.rows.length === 0) {
      throw new NotFoundException('Department not found');
    }

    // ==========================================
    // CHECK EMPLOYEES
    // ==========================================

    const employeeCheck = await client.query(
      `
      SELECT id
      FROM employees
      WHERE department_id = $1
      LIMIT 1;
      `,
      [id],
    );

    if (employeeCheck.rows.length > 0) {
      throw new ConflictException(
        'Cannot delete department because employees are assigned to it',
      );
    }

    // ==========================================
    // FIND DESIGNATIONS
    // ==========================================

    const designationResult = await client.query(
      `
      SELECT id
      FROM designations
      WHERE department_id = $1;
      `,
      [id],
    );

    const designationIds = designationResult.rows.map(
      (row) => row.id,
    );

    // ==========================================
    // CHECK IF DESIGNATIONS ARE USED BY EMPLOYEES
    // ==========================================

    if (designationIds.length > 0) {
      const designationEmployeeCheck = await client.query(
        `
        SELECT id
        FROM employees
        WHERE designation_id = ANY($1::int[])
        LIMIT 1;
        `,
        [designationIds],
      );

      if (designationEmployeeCheck.rows.length > 0) {
        throw new ConflictException(
          'Cannot delete department because its designations are assigned to employees',
        );
      }
    }

    // ==========================================
    // DELETE DESIGNATIONS
    // ==========================================

    if (designationIds.length > 0) {
      await client.query(
        `
        DELETE FROM designations
        WHERE department_id = $1;
        `,
        [id],
      );
    }

    // ==========================================
    // DELETE DEPARTMENT
    // ==========================================

    const result = await client.query(
      `
      DELETE FROM departments
      WHERE id = $1
      RETURNING *;
      `,
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Department not found');
    }

    await client.query('COMMIT');

    return {
      message: 'Department deleted successfully',
      department: result.rows[0],
    };

  } catch (error: any) {
    await client.query('ROLLBACK');

    if (
      error instanceof ConflictException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    // PostgreSQL foreign-key error
    if (error?.code === '23503') {
      throw new ConflictException(
        'Cannot delete department because it is being used by another record',
      );
    }

    throw error;

  } finally {
    client.release();
  }
}
}
