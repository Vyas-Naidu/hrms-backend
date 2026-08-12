import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class DesignationService {
  constructor(private readonly dbService: DbService) {}

  async create(designation: any) {
    const { designationName } = designation;

    const query = `
      INSERT INTO designations (
        designation_name
      )
      VALUES ($1)
      RETURNING *;
    `;

    const result = await this.dbService.query(query, [designationName]);

    return result.rows[0];
  }
  // READ ALL
  async findAll() {
    const query = `
    SELECT *
    FROM designations;
  `;

    const result = await this.dbService.query(query);

    return result.rows;
  }
  // READ ONE
  async findOne(id: string) {
    const query = `
    SELECT *
    FROM designations
    WHERE id = $1;
  `;

    const result = await this.dbService.query(query, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Designation not found');
    }

    return result.rows[0];
  }
  async update(id: string, designation: any) {
    const { designationName } = designation;

    const query = `
    UPDATE designations
    SET
      designation_name = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
  `;

    const result = await this.dbService.query(query, [designationName, id]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Designation not found');
    }

    return result.rows[0];
  }
  async remove(id: string) {
    const query = `
    DELETE FROM designations
    WHERE id = $1
    RETURNING *;
  `;

    const result = await this.dbService.query(query, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Designation not found');
    }

    return {
      message: 'Designation deleted successfully',
    };
  }
}
