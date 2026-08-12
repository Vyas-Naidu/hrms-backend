import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';

import { EmployeeService } from './employee.service';
import { multerConfig } from '../common/multer.config';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  findAll() {
    return this.employeeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

 @Post()
@UseInterceptors(
  FilesInterceptor('files', 20, multerConfig),
)
create(
  @Body('employeeData') employeeData: string,

  @Body('personalInfo') personalInfo: string,

  @Body('addresses') addresses: string,

  @Body('documentsMetadata')
  documentsMetadata: string,

  @UploadedFiles()
  files: Express.Multer.File[],
) {
  return this.employeeService.create(
    JSON.parse(employeeData),
    JSON.parse(personalInfo),
    JSON.parse(addresses),
    JSON.parse(documentsMetadata),
    files,
  );
}
  @Put(':id')
  update(@Param('id') id: string, @Body() employee: any) {
    return this.employeeService.update(id, employee);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeeService.remove(id);
  }
}
