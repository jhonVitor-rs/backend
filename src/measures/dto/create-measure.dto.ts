import { IsString, IsDateString, IsEnum, IsBase64 } from 'class-validator';

export class CreateMeasureDto {
  @IsString({ message: 'A imagem deve ser uma string.' })
  @IsBase64({}, { message: 'A imagem precisa ser em base64' })
  image: string;

  @IsString({ message: 'O código do cliente deve ser uma string.' })
  customer_code: string;

  @IsDateString(
    {},
    {
      message: 'A data da leitura deve estar em um formato de data válido.',
    },
  )
  measure_datetime: Date;

  @IsEnum(['WATER', 'GAS'], {
    message: 'O tipo de leitura deve ser "WATER" ou "GAS".',
  })
  measure_type: 'WATER' | 'GAS';
}
