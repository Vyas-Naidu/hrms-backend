import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { EmployeeService } from './employee.service';
import { multerMemoryConfig } from '../common/multer.config';
import type { EmployeeUploadedFiles } from '../common/document-upload';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  findAll() {
    return this.employeeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeeService.findOne(String(id));
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profilePhoto', maxCount: 1 },
        { name: 'aadhaar', maxCount: 1 },
        { name: 'pan', maxCount: 1 },
        { name: 'drivingLicense', maxCount: 1 },
        { name: 'education', maxCount: 10 },
        { name: 'experience', maxCount: 10 },
        { name: 'resume', maxCount: 1 },
      ],
      multerMemoryConfig,
    ),
  )
  create(
    @Body('employeeData') employeeData: string,
    @Body('personalInfo') personalInfo: string,
    @Body('addresses') addresses: string,
    @Body('documentsMetadata') documentsMetadata: string,
    @UploadedFiles() files: EmployeeUploadedFiles,
  ) {
    try {
      return this.employeeService.create(
        JSON.parse(employeeData),
        JSON.parse(personalInfo),
        JSON.parse(addresses),
        documentsMetadata ? JSON.parse(documentsMetadata) : [],
        files ?? {},
      );
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Invalid JSON in multipart form data');
      }
      throw error;
    }
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() employee: any) {
    return this.employeeService.update(String(id), employee);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeeService.remove(String(id));
  }
}
