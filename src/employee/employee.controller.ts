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

import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { EmployeeService } from './employee.service';
import { multerMemoryConfig } from '../common/multer.config';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  // =====================================================
  // GET ALL EMPLOYEES
  // =====================================================

  @Get()
  findAll() {
    return this.employeeService.findAll();
  }

  // =====================================================
  // GET EMPLOYEE BY ID
  // =====================================================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  // =====================================================
  // CREATE EMPLOYEE
  // =====================================================

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profilePhoto', maxCount: 1 },
        { name: 'aadhaar', maxCount: 1 },
        { name: 'pan', maxCount: 1 },
        { name: 'drivingLicense', maxCount: 1 },

        // Multiple education documents
        { name: 'education', maxCount: 10 },

        // Multiple experience documents
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

    @Body('documentsMetadata')
    documentsMetadata: string,

    @UploadedFiles()
    files: {
      profilePhoto?: Express.Multer.File[];
      aadhaar?: Express.Multer.File[];
      pan?: Express.Multer.File[];
      drivingLicense?: Express.Multer.File[];
      education?: Express.Multer.File[];
      experience?: Express.Multer.File[];
      resume?: Express.Multer.File[];
    },
  ) {
    // Multipart/form-data sends JSON fields as strings.
    const employee = JSON.parse(employeeData);
    const personal = JSON.parse(personalInfo);
    const addressData = JSON.parse(addresses);
    const documents = JSON.parse(documentsMetadata);

    // ===================================================
    // CONVERT FILE FIELDS INTO ONE ARRAY
    // ===================================================

    const uploadedFiles = Object.entries(files).flatMap(
      ([fieldName, fieldFiles]) =>
        (fieldFiles ?? []).map((file) => ({
          ...file,
          fieldName,
        })),
    );

    // ===================================================
    // SEND DATA TO SERVICE
    // ===================================================

    return this.employeeService.create(
      employee,
      personal,
      addressData,
      documents,
      uploadedFiles,
    );
  }

  // =====================================================
  // UPDATE EMPLOYEE
  // =====================================================

  @Put(':id')
  update(@Param('id') id: string, @Body() employee: any) {
    return this.employeeService.update(id, employee);
  }

  // =====================================================
  // DELETE EMPLOYEE
  // =====================================================

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeeService.remove(id);
  }
}
