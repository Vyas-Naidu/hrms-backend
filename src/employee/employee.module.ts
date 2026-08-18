import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [EmployeeController, DocumentController],
  providers: [EmployeeService, DocumentService],
})
export class EmployeeModule {}
