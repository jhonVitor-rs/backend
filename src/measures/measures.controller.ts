import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { MeasuresService } from './measures.service';
import { CreateMeasureDto } from './dto/create-measure.dto';
import { UpdateMeasureDto } from './dto/update-measure.dto';

@Controller('measures')
export class MeasuresController {
  constructor(private readonly measuresService: MeasuresService) {}

  @Post()
  async create(@Body() createMeasureDto: CreateMeasureDto) {
    return await this.measuresService.create(createMeasureDto);
  }

  @Get(':id/list')
  async findAll(
    @Param('id') id: string,
    @Query('measure_type') measure_type?: 'WATER' | 'GAS',
  ) {
    return await this.measuresService.findAll(id, measure_type);
  }

  @Patch()
  async update(@Body() updateMeasureDto: UpdateMeasureDto) {
    return await this.measuresService.update(updateMeasureDto);
  }
}
