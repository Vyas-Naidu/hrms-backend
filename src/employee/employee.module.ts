import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { DbModule } from '../db/db.module';
import { EmployeeTestController } from './employee-test.controller';
import { EmployeeTestService } from './employee-test.service';

@Module({
  imports: [DbModule],
  controllers: [EmployeeController, EmployeeTestController],
  providers: [EmployeeService, EmployeeTestService],
})
export class EmployeeModule {}
