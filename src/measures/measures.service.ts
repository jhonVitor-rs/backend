import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
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

  // Criação de measure
  async create(createMeasureDto: CreateMeasureDto) {
    const { image, customer_code, measure_datetime, measure_type } =
      createMeasureDto;

    try {
      // Verificação se ja existe uma medição para o mês
      const existingMeasure = await this.prisma.measure.findFirst({
        where: {
          customer_code,
          measure_type,
          measure_datetime: {
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

      // Integração com o serviço da API do Google
      const { image_url, mime_type } = await this.gemini.uploadImage(image);
      const measure_value = await this.gemini.getMeasureValue(
        mime_type,
        image_url,
      );

      // Criação da measure no banco de dados
      const savedMeasure = await this.prisma.measure.create({
        data: {
          customer_code,
          measure_datetime,
          measure_type,
          image_url,
          measure_value,
        },
      });

      // Resposta ao usuário
      return {
        image_url: savedMeasure.image_url,
        measure_value: savedMeasure.measure_value,
        measure_uuid: savedMeasure.id,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error; // Relançar o erro de conflito
      } else if (error.response && error.response.error_code) {
        throw new BadRequestException({
          error_code: error.response.error_code,
          error_description: error.response.error_description,
        });
      } else {
        console.error('Erro interno:', error);
        throw new InternalServerErrorException({
          error_code: 'INTERNAL_SERVER_ERROR',
          error_description: 'Erro interno do servidor',
        });
      }
    }
  }

  // Busca das marcaçõs de um usuário
  async findAll(customer_code: string, measure_type?: string) {
    try {
      // Valida se o measure type existir deve se no tipo especifico
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

      // Recuperação de dados
      const measure = await this.prisma.measure.findMany({
        where: {
          customer_code,
          AND: measure_type
            ? [
                {
                  measure_type: {
                    contains: measure_type.toUpperCase(),
                    mode: 'insensitive',
                  },
                },
              ]
            : [],
        },
      });

      // Se não existe nenhum registro um erro e retornado
      if (measure.length <= 0) {
        throw new NotFoundException({
          error_code: 'MEASURES_NOT_FOUND',
          error_description: 'Nenhuma leitura encontrada',
        });
      } else {
        // Retorno dos registros
        return {
          customer_code,
          measures: measure.map((m) => ({
            measure_uuid: m.id,
            measure_datetime: m.measure_datetime,
            measure_type: m.measure_type,
            has_confirmed: m.has_confirmed,
            image_url: m.image_url,
          })),
        };
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error; // Se for um erro conhecido apenas retorna ele
      } else if (error.response && error.response.error_code) {
        throw new BadRequestException({
          error_code: error.response.error_code,
          error_description: error.response.error_description,
        });
      } else {
        console.error('Erro interno:', error);
        throw new InternalServerErrorException({
          error_code: 'INTERNAL_SERVER_ERROR',
          error_description: 'Erro interno do servidor',
        });
      }
    }
  }

  // Atualização da measure
  async update(updateMeasureDto: UpdateMeasureDto) {
    const { measure_uuid, confirmed_value } = updateMeasureDto;

    try {
      const measure = await this.prisma.measure.findUnique({
        where: { id: measure_uuid },
      });

      // Lançamento de erro caso não exista measure para o id fornecido
      if (!measure) {
        throw new NotFoundException({
          error_code: 'MEASURE_NOT_FOUND',
          error_description: 'Leitura do mes já realizada',
        });
      }

      // Lançamento de erro caso a measure ja esteja confirmada
      if (measure.has_confirmed) {
        throw new ConflictException({
          error_code: 'CONFIRMATION_DUPLICATE',
          error_description: 'Leitura do mês ja confirmada.',
        });
      }

      // Atualização da measure
      await this.prisma.measure.update({
        where: { id: measure_uuid },
        data: {
          measure_value: confirmed_value,
          has_confirmed: true,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error; // Se for um erro conhecido apenas retorna ele
      } else if (error.response && error.response.error_code) {
        throw new BadRequestException({
          error_code: error.response.error_code,
          error_description: error.response.error_description,
        });
      } else {
        console.error('Erro interno:', error);
        throw new InternalServerErrorException({
          error_code: 'INTERNAL_SERVER_ERROR',
          error_description: 'Erro interno do servidor',
        });
      }
    }
  }
}
