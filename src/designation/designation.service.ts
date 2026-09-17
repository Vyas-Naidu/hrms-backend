import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class DesignationService {
  constructor(private readonly dbService: DbService) {}

  // CREATE
 async create(designation: any) {
  const designationName = designation?.designationName?.trim();
  const departmentId = designation?.department_id;

  if (!designationName) {
    throw new BadRequestException(
      'Designation name is required',
    );
  }

  if (!departmentId) {
    throw new BadRequestException(
      'Department is required',
    );
  }

  try {
    const departmentResult = await this.dbService.query(
      `
      SELECT id
      FROM departments
      WHERE id = $1;
      `,
      [departmentId],
    );

    if (departmentResult.rows.length === 0) {
      throw new NotFoundException(
        'Department not found',
      );
    }

    const result = await this.dbService.query(
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

    return result.rows[0];

  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }

    if (error?.code === '23505') {
      throw new ConflictException(
        'Designation already exists in this department',
      );
    }

    throw error;
  }
}
  // READ ALL
async findAll() {
  const result = await this.dbService.query(
    `
    SELECT
      d.id,
      d.designation_name,
      d.department_id,
      dep.department_name
    FROM designations d
    LEFT JOIN departments dep
      ON d.department_id = dep.id
    ORDER BY d.id;
    `,
  );

  return result.rows;
}
  // READ ONE
  async findOne(id: string) {
    const result = await this.dbService.query(
      `
      SELECT *
      FROM designations
      WHERE id = $1;
      `,
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Designation not found');
    }

    return result.rows[0];
  }

  // UPDATE
  // UPDATE
async update(id: string, designation: any) {
  const designationName = designation?.designationName?.trim();

  if (!designationName) {
    throw new BadRequestException(
      'Designation name is required',
    );
  }

  try {
    const result = await this.dbService.query(
      `
      UPDATE designations
      SET
        designation_name = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
      `,
      [designationName, id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Designation not found');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }

    if (error?.code === '23505') {
      throw new ConflictException(
        'Designation already exists',
      );
    }

    throw error;
  }
}
 // DELETE
async remove(id: string) {
  try {
    // Check whether designation exists
    const designationResult = await this.dbService.query(
      `
      SELECT id
      FROM designations
      WHERE id = $1;
      `,
      [id],
    );

    if (designationResult.rows.length === 0) {
      throw new NotFoundException('Designation not found');
    }

    // Check whether any employee is using this designation
    const employeeResult = await this.dbService.query(
      `
      SELECT id
      FROM employees
      WHERE designation_id = $1
      LIMIT 1;
      `,
      [id],
    );

    if (employeeResult.rows.length > 0) {
      throw new ConflictException(
        'Cannot delete designation because employees are assigned to it',
      );
    }

    // Delete designation
    const result = await this.dbService.query(
      `
      DELETE FROM designations
      WHERE id = $1
      RETURNING *;
      `,
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Designation not found');
    }

    return {
      message: 'Designation deleted successfully',
    };

  } catch (error: any) {
    // Keep our custom errors
    if (
      error instanceof ConflictException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    // PostgreSQL foreign-key violation
    if (error?.code === '23503') {
      throw new ConflictException(
        'Cannot delete designation because it is being used by another record',
      );
    }

    throw error;
  }
}
}
