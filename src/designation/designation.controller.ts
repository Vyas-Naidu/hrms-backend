import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DesignationService } from './designation.service';

@Controller('designations')
export class DesignationController {
  constructor(private readonly designationService: DesignationService) {}

  @Post()
  create(@Body() body: any) {
    return this.designationService.create(body);
  }

  @Get()
  findAll() {
    return this.designationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.designationService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.designationService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.designationService.remove(id);
  }
}
