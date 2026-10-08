import { Module } from '@nestjs/common';
import { DesignationController } from './designation.controller';
import { DesignationService } from './designation.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [DesignationController],
  providers: [DesignationService],
})
export class DesignationModule {}
