import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import type { Response } from 'express';

import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { multerMemoryConfig } from '../common/multer.config';

import { EmployeeTestService } from './employee-test.service';

@Controller('employee-test')
export class EmployeeTestController {
  constructor(private readonly employeeTestService: EmployeeTestService) {}

  // ============================================================
  // TEST EMPLOYEE REGISTRATION WITH FILE UPLOAD
  // ============================================================

  @Post('register')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profilePhoto', maxCount: 1 },
        { name: 'aadhaar', maxCount: 1 },
        { name: 'pan', maxCount: 1 },
        { name: 'passport', maxCount: 1 },
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
  async register(
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
      passport?: Express.Multer.File[];
      drivingLicense?: Express.Multer.File[];
      education?: Express.Multer.File[];
      experience?: Express.Multer.File[];
      resume?: Express.Multer.File[];
    },
  ) {
    // Convert JSON strings from multipart/form-data
    const employee = JSON.parse(employeeData);
    const personal = JSON.parse(personalInfo);
    const addressData = JSON.parse(addresses);
    const documents = JSON.parse(documentsMetadata);

    // Pass all parsed data and uploaded files to service
    return this.employeeTestService.register(
      employee,
      personal,
      addressData,
      documents,
      files,
    );
  }

  @Post(':employeeId/documents')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profilePhoto', maxCount: 1 },
        { name: 'aadhaar', maxCount: 1 },
        { name: 'pan', maxCount: 1 },
        { name: 'passport', maxCount: 1 },
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
  async uploadDocuments(
    @Param('employeeId') employeeId: string,

    @UploadedFiles()
    files: {
      profilePhoto?: Express.Multer.File[];
      aadhaar?: Express.Multer.File[];
      pan?: Express.Multer.File[];
      passport?: Express.Multer.File[];
      drivingLicense?: Express.Multer.File[];
      education?: Express.Multer.File[];
      experience?: Express.Multer.File[];
      resume?: Express.Multer.File[];
    },
  ) {
    return this.employeeTestService.uploadDocuments(Number(employeeId), files);
  }
  // ============================================================
  // RETRIEVE UPLOADED DOCUMENT
  // ============================================================

  @Get('documents/:id')
  async getDocument(@Param('id') id: string, @Res() response: Response) {
    const documentId = Number(id);

    const document = await this.employeeTestService.getDocument(documentId);

    response.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `inline; filename="${document.originalFileName}"`,
    });

    response.send(document.fileData);
  }
  @Get(':employeeId/documents')
  async getEmployeeDocuments(@Param('employeeId') employeeId: string) {
    return this.employeeTestService.getEmployeeDocuments(Number(employeeId));
  }
  @Put('documents/:id')
  async updateDocument(
    @Param('id') id: string,
    @Body()
    documentData: {
      documentName?: string;
      documentType?: string;
    },
  ) {
    return this.employeeTestService.updateDocument(Number(id), documentData);
  }
  @Delete('documents/:id')
  async deleteDocument(@Param('id') id: string) {
    return this.employeeTestService.deleteDocument(Number(id));
  }
}
