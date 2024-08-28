import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
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

  async findAll(customer_code: string, measure_type?: string) {
    const validateMeasureType = ['WATER', 'GAS'];
    if (
      measure_type &&
      !validateMeasureType.includes(measure_type.toUpperCase())
    ) {
      throw new BadRequestException({
        error_code: 'INVALID_TYPE',
        error_description: 'Tipo de medição não permitido',
      });
    }

    const measure = await this.prisma.measure.findMany({
      where: {
        customerCode: customer_code,
        AND: [
          {
            measureType: {
              contains: measure_type.toUpperCase(),
              mode: 'insensitive',
            },
          },
        ],
      },
    });

    if (measure.length <= 0) {
      throw new NotFoundException({
        error_code: 'MEASURES_NOT_FOUND',
        error_description: 'Nenhuma leitura encontrada',
      });
    } else {
      return {
        custumer_code: customer_code,
        measures: measure.map((m) => ({
          measure_uuid: m.id,
          measure_datetime: m.measureDatetime,
          measure_type: m.measureType,
          has_confirmed: m.hasConfirmed,
          image_url: m.imageUrl,
        })),
      };
    }
  }

  async update(updateMeasureDto: UpdateMeasureDto) {
    const { measure_uuid, confirmed_value } = updateMeasureDto;

    const measure = await this.prisma.measure.findUnique({
      where: { id: measure_uuid },
    });

    if (!measure) {
      throw new NotFoundException({
        error_code: 'MEASURE_NOT_FOUND',
        error_description: 'Leitura do mes já realizada',
      });
    }

    if (measure.hasConfirmed) {
      throw new ConflictException({
        error_code: 'CONFIRMATION_DUPLICATE',
        error_description: 'Leitura do mês ja confirmada',
      });
    }

    await this.prisma.measure.update({
      where: { id: measure_uuid },
      data: {
        measureValue: confirmed_value,
        hasConfirmed: true,
      },
    });

    return {
      success: true,
    };
  }
}
