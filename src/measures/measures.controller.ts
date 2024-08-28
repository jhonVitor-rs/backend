import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { MeasuresService } from './measures.service';
import { CreateMeasureDto } from './dto/create-measure.dto';
import { UpdateMeasureDto } from './dto/update-measure.dto';

@Controller('measures')
export class MeasuresController {
  constructor(private readonly measuresService: MeasuresService) {}

  @Post()
  async create(@Body() createMeasureDto: CreateMeasureDto) {
    return this.measuresService.create(createMeasureDto);
  }

  @Get()
  findAll() {
    // return this.measuresService.findAll(id);
    return 'Hello form measure';
  }

  @Patch()
  update(@Body() updateMeasureDto: UpdateMeasureDto) {
    return this.measuresService.update(id, updateMeasureDto);
  }
}
