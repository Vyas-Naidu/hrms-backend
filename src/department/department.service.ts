import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class DepartmentService {
  constructor(private readonly dbService: DbService) {}

  // CREATE
  async create(department: any) {
    const departmentName = department?.departmentName?.trim();
    const departmentCode = department?.departmentCode?.trim();

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

      // Find existing department by name and code
      let departmentResult = await client.query(
        `
        SELECT *
        FROM departments
        WHERE LOWER(department_name) = LOWER($1)
          AND LOWER(department_code) = LOWER($2);
        `,
        [departmentName, departmentCode],
      );

      // Create department only if it does not exist
      if (departmentResult.rows.length === 0) {
        departmentResult = await client.query(
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
      }

      const departmentRow = departmentResult.rows[0];
      const departmentId = departmentRow.id;

      // Create designations for this department
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

      if (
        error?.code === '23505' &&
        error?.constraint === 'unique_department_designation'
      ) {
        throw new ConflictException(
          'Designation already exists in this department',
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
    const departmentName = department?.departmentName?.trim();
    const departmentCode = department?.departmentCode?.trim();

    if (!departmentName) {
      throw new BadRequestException('Department name is required');
    }

    if (!departmentCode) {
      throw new BadRequestException('Department code is required');
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
        throw new NotFoundException('Department not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error?.code === '23505') {
        throw new ConflictException(
          'Department name or code already exists',
        );
      }

      throw error;
    }
  }

  // DELETE
  async remove(id: string) {
    const result = await this.dbService.query(
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

    return {
      message: 'Department deleted successfully',
    };
  }
}
