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
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { multerMemoryConfig } from '../common/multer.config';
import type { EmployeeUploadedFiles } from '../common/document-upload';
import { DocumentService } from './document.service';

@Controller()
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('employees/:employeeId/documents')
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
  upload(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Body('documentsMetadata') documentsMetadata: string,
    @UploadedFiles() files: EmployeeUploadedFiles,
  ) {
    try {
      return this.documentService.upload(
        employeeId,
        documentsMetadata ? JSON.parse(documentsMetadata) : [],
        files ?? {},
      );
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Invalid JSON in documentsMetadata');
      }
      throw error;
    }
  }

  @Get('employees/:employeeId/documents')
  getEmployeeDocuments(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.documentService.getEmployeeDocuments(employeeId);
  }

  @Get('documents/:id')
  async getDocument(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    const document = await this.documentService.getDocument(id);

    const safeFileName = document.originalFileName
      .replace(/[\r\n"]/g, '')
      .replace(/[^\x20-\x7E]/g, '_');

    response.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `inline; filename="${safeFileName}"`,
    });

    response.send(document.fileData);
  }

  @Put('documents/:id')
  updateDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    documentData: {
      documentName?: string;
      documentType?: string;
    },
  ) {
    return this.documentService.updateDocument(id, documentData);
  }

  @Delete('documents/:id')
  deleteDocument(@Param('id', ParseIntPipe) id: number) {
    return this.documentService.deleteDocument(id);
  }
}
