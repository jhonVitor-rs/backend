import { Test, TestingModule } from '@nestjs/testing';
import { MeasuresService } from './measures.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleGeminiService } from 'src/google-gemini/google-gemini.service';
import { CreateMeasureDto } from './dto/create-measure.dto';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Measure } from '@prisma/client';
import { UpdateMeasureDto } from './dto/update-measure.dto';

describe('MeasuresService', () => {
  let service: MeasuresService;
  let prismaService: PrismaService;
  let geminiService: GoogleGeminiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeasuresService,
        {
          provide: PrismaService,
          useValue: {
            measure: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: GoogleGeminiService,
          useValue: {
            uploadImage: jest.fn(),
            getMeasureValue: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MeasuresService>(MeasuresService);
    prismaService = module.get<PrismaService>(PrismaService);
    geminiService = module.get<GoogleGeminiService>(GoogleGeminiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createMeasureDto: CreateMeasureDto = {
      image: 'testBase64Image',
      customer_code: '1234',
      measure_datetime: new Date(),
      measure_type: 'WATER',
    };

    it('Lançar um ConflictException caso ja haja uma leitura do mesmo tipo para o mês', async () => {
      prismaService.measure.findFirst = jest
        .fn()
        .mockResolvedValueOnce({ id: 'existing-measure-id' });

      await expect(service.create(createMeasureDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prismaService.measure.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          customer_code: createMeasureDto.customer_code,
          measure_type: createMeasureDto.measure_type,
        }),
      });
    });

    it('Sucesso ao criar a measure', async () => {
      prismaService.measure.findFirst = jest.fn().mockResolvedValueOnce(null);
      geminiService.uploadImage = jest.fn().mockResolvedValueOnce({
        image_url: 'https://fakeurl.com/image.jpg',
        mime_type: 'image/jpeg',
      });
      geminiService.getMeasureValue = jest.fn().mockResolvedValueOnce(42);
      prismaService.measure.create = jest.fn().mockResolvedValueOnce({
        measure_uuid: 'new-measure-id',
        image_url: 'https://fakeurl.com/image.jpg',
        measure_value: 42,
      });

      const result = await prismaService.measure.create({
        data: createMeasureDto,
      });

      expect(result).toEqual({
        image_url: 'https://fakeurl.com/image.jpg',
        measure_value: 42,
        measure_uuid: 'new-measure-id',
      });
    });

    it('Lançamento de InternalServerError caso haja um erro durante o upload da imagem no Gemini', async () => {
      prismaService.measure.findFirst = jest.fn().mockResolvedValueOnce(null);
      geminiService.uploadImage = jest
        .fn()
        .mockResolvedValueOnce(new Error('Upload Filed'));

      await expect(service.create(createMeasureDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    const customer_code = '123456';
    const measure_type = 'WATER';
    const measures: Measure[] = [
      {
        id: 'measure_id',
        customer_code: customer_code,
        has_confirmed: false,
        image_url: 'http://example.com/image.jpeg',
        measure_type: 'WATER',
        measure_value: 45,
        measure_datetime: new Date(),
      },
    ];

    it('Lança um BadRequestException caso o measure_type seja de um tipo invalido', async () => {
      expect(service.findAll(customer_code, 'LUZ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Lança um NotFoundExceprion caso não encontre nenhum registro para o customer_code ou para o measure_type fornecido(s)', async () => {
      prismaService.measure.findMany = jest.fn().mockResolvedValueOnce([]);

      await expect(
        service.findAll(customer_code, measure_type),
      ).rejects.toThrow(NotFoundException);
    });

    it('Retorna um array contendo todas as marcações que correspondem aos parametros da pesquisa', async () => {
      prismaService.measure.findMany = jest.fn().mockResolvedValue(measures);

      const result = await service.findAll(customer_code, measure_type);

      expect(result).toEqual({
        customer_code,
        measures: measures.map((m) => ({
          measure_uuid: m.id,
          measure_datetime: m.measure_datetime,
          measure_type: m.measure_type,
          has_confirmed: m.has_confirmed,
          image_url: m.image_url,
        })),
      });
    });
  });

  describe('update', () => {
    const measure_water: Measure = {
      id: 'measure_water',
      customer_code: '123456',
      has_confirmed: false,
      image_url: 'http://example.com/image.jpeg',
      measure_type: 'WATER',
      measure_value: 48,
      measure_datetime: new Date(),
    };
    const measure_gas: Measure = {
      id: 'measure_gas',
      customer_code: '123456',
      has_confirmed: true,
      image_url: 'http://example.com/image.jpeg',
      measure_type: 'GAS',
      measure_value: 60,
      measure_datetime: new Date(),
    };
    const updateMeasureDto: UpdateMeasureDto = {
      measure_uuid: 'measure_water',
      confirmed_value: 60,
    };

    it('Lança um NotFoundException caso não encontre measure para o id fornecido', async () => {
      prismaService.measure.findUnique = jest.fn().mockResolvedValueOnce(null);

      await expect(service.update(updateMeasureDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Lança um ConflictException caso a measure ja tenha sido confirmada', async () => {
      prismaService.measure.findUnique = jest
        .fn()
        .mockResolvedValueOnce(measure_gas);

      await expect(
        service.update({ measure_uuid: 'measure_gas', confirmed_value: 80 }),
      ).rejects.toThrow(ConflictException);
    });

    it('Atualiza com sucesso a measure', async () => {
      prismaService.measure.findUnique = jest
        .fn()
        .mockResolvedValueOnce(measure_water);
      prismaService.measure.update = jest
        .fn()
        .mockResolvedValueOnce(measure_water);

      const result = await service.update(updateMeasureDto);
      expect(result).toEqual({ success: true });
      expect(prismaService.measure.update).toHaveBeenCalledWith({
        where: { id: updateMeasureDto.measure_uuid },
        data: {
          measure_value: updateMeasureDto.confirmed_value,
          has_confirmed: true,
        },
      });
    });
  });
});
