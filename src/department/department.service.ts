import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class DepartmentService {
  constructor(private readonly dbService: DbService) {}

  // CREATE
  async create(department: any) {
    const { departmentName, departmentCode } = department;

    const query = `
      INSERT INTO departments (
        department_name,
        department_code
      )
      VALUES ($1, $2)
      RETURNING *;
    `;

    const result = await this.dbService.query(query, [
      departmentName,
      departmentCode,
    ]);

    return result.rows[0];
  }

  // READ ALL
  async findAll() {
    const query = `
      SELECT *
      FROM departments;
    `;

    const result = await this.dbService.query(query);

    return result.rows;
  }

  // READ ONE
  async findOne(id: string) {
    const query = `
      SELECT *
      FROM departments
      WHERE id = $1;
    `;

    const result = await this.dbService.query(query, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Department not found');
    }

    return result.rows[0];
  }

  // UPDATE
  async update(id: string, department: any) {
    const { departmentName, departmentCode } = department;

    const query = `
      UPDATE departments
      SET
        department_name = $1,
        department_code = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `;

    const result = await this.dbService.query(query, [
      departmentName,
      departmentCode,
      id,
    ]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Department not found');
    }

    return result.rows[0];
  }

  // DELETE
  async remove(id: string) {
    const query = `
      DELETE FROM departments
      WHERE id = $1
      RETURNING *;
    `;

    const result = await this.dbService.query(query, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Department not found');
    }

    return {
      message: 'Department deleted successfully',
    };
  }
}
