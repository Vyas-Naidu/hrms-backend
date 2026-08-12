import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, PoolClient } from 'pg';


@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      host: this.configService.get<string>('DB_HOST'),
      port: Number(this.configService.get<string>('DB_PORT')),
      user: this.configService.get<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),
    });
  }

  async onModuleInit() {
    try {
      const result = await this.pool.query('SELECT NOW()');

      console.log('✅ Database connected successfully');
      console.log(result.rows[0]);
    } catch (error) {
      console.error('❌ Database connection failed');
      console.error(error);
    }
  }

  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    return this.pool.query(sql, params);
  }
  async getClient(): Promise<PoolClient> {
  return this.pool.connect();
}

  async onModuleDestroy() {
    await this.pool.end();
    console.log('🔌 Database connection closed');
  }
}
