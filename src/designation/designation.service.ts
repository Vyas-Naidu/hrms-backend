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

    if (!designationName) {
      throw new BadRequestException(
        'Designation name is required',
      );
    }

    try {
      const result = await this.dbService.query(
        `
        INSERT INTO designations (
          designation_name
        )
        VALUES ($1)
        RETURNING *;
        `,
        [designationName],
      );

      return result.rows[0];
    } catch (error) {
      if (error?.code === '23505') {
        throw new ConflictException(
          'Designation already exists',
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
      FROM designations
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
  }
}
