import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateMeasureDto } from './dto/create-measure.dto';
import { UpdateMeasureDto } from './dto/update-measure.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleGeminiService } from 'src/google-gemini/google-gemini.service';

@Injectable()
export class MeasuresService {
  constructor(
    private prisma: PrismaService,
    private gemini: GoogleGeminiService,
  ) {}

  async create(createMeasureDto: CreateMeasureDto) {
    const { image, customer_code, measure_datetime, measure_type } =
      createMeasureDto;

    const existingMeasure = await this.prisma.measure.findFirst({
      where: {
        customerCode: customer_code,
        measureType: measure_type,
        measureDatetime: {
          gte: new Date(
            new Date(measure_datetime).getFullYear(),
            new Date(measure_datetime).getMonth(),
            1,
          ),
          lt: new Date(
            new Date(measure_datetime).getFullYear(),
            new Date(measure_datetime).getMonth() + 1,
            1,
          ),
        },
      },
    });
    if (existingMeasure) {
      throw new ConflictException({
        error_code: 'DOUBLE_REPORT',
        error_description: 'Leitura do mês ja realizada',
      });
    }

    const geminiResult = await this.gemini.uploadImage(image);

    const savedMeasure = await this.prisma.measure.create({
      data: {
        customerCode: customer_code,
        measureDatetime: measure_datetime,
        measureType: measure_type,
        imageUrl: geminiResult.image_url,
        measureValue: +geminiResult.measure_value,
      },
    });

    return {
      image_url: savedMeasure.imageUrl,
      measure_value: savedMeasure.measureValue,
      measure_uuid: savedMeasure.id,
    };
  }

  findAll() {
    return `This action returns all measures`;
  }

  update(id: number, updateMeasureDto: UpdateMeasureDto) {
    return `This action updates a #${id} measure`;
  }
}
