import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { DesignationService } from './designation.service';

@Controller('designation')
export class DesignationController {
  constructor(private readonly designationService: DesignationService) {}

  @Post()
  async create(@Body() body: any) {
    return await this.designationService.create(body);
  }
  @Get()
  async findAll() {
    return await this.designationService.findAll();
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.designationService.findOne(id);
  }
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return await this.designationService.update(id, body);
  }
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.designationService.remove(id);
  }
}
