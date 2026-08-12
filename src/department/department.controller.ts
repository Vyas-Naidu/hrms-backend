import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { DepartmentService } from './department.service';

@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  async create(@Body() body: any) {
    const result = await this.departmentService.create(body);

    return result;
  }
  @Get()
  async findAll() {
    return await this.departmentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.departmentService.findOne(id);
  }
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return await this.departmentService.update(id, body);
  }
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.departmentService.remove(id);
  }
}
