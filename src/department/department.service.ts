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

    if (!departmentName) {
      throw new BadRequestException('Department name is required');
    }

    if (!departmentCode) {
      throw new BadRequestException('Department code is required');
    }

    try {
      const result = await this.dbService.query(
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

      return result.rows[0];
    } catch (error) {
      if (error?.code === '23505') {
        throw new ConflictException(
          'Department name or code already exists',
        );
      }

      throw error;
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
