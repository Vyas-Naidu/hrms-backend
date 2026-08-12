import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DepartmentModule } from './department/department.module';

import { DbModule } from './db/db.module';

import { DesignationModule } from './designation/designation.module';

import { EmployeeModule } from './employee/employee.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DbModule,
    DepartmentModule,
    DesignationModule,
    EmployeeModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
