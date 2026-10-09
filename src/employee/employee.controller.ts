import {
  BadRequestException,
  Request,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { EmployeeService } from './employee.service';
import { multerMemoryConfig } from '../common/multer.config';
import type { EmployeeUploadedFiles } from '../common/document-upload';


import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) { }

  @Roles(Role.ADMIN, Role.HR)
  @Get()
  findAll() {
    return this.employeeService.findAll();
  }
  @Get('me')
  findMyProfile(
    @Request() request: {
      user: { employeeId: number; role: Role };
    },
  ) {
    return this.employeeService.findMyProfile(
      request.user.employeeId,
    );
  }
  @Roles(Role.ADMIN, Role.HR)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: {
      user: { employeeId: number; role: Role };
    },
  ) {
    return this.employeeService.findOne(
      String(id),
      request.user,
    );
  }

  @Roles(Role.ADMIN, Role.HR)
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
  @Roles(Role.ADMIN, Role.HR)
  @Put(':id')
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
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body('employeeData') employeeData: string,
    @Body('personalInfo') personalInfo: string,
    @Body('addresses') addresses: string,
    @Body('documentsMetadata') documentsMetadata: string,
    @UploadedFiles() files: EmployeeUploadedFiles,
  ) {
    try {
      return this.employeeService.update(
        String(id),
        {
          employeeData: employeeData ? JSON.parse(employeeData) : {},
          personalInfo: personalInfo ? JSON.parse(personalInfo) : {},
          addresses: addresses ? JSON.parse(addresses) : {},
          documentsMetadata: documentsMetadata
            ? JSON.parse(documentsMetadata)
            : [],
        },
        files ?? {},
      );
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException(
          'Invalid JSON in multipart form data',
        );
      }

      throw error;
    }
  }
  @Roles(Role.ADMIN, Role.HR)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeeService.remove(String(id));
  }
}
