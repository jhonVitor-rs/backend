import { IsNumber, IsString, IsUUID } from 'class-validator';

export class UpdateMeasureDto {
  @IsString({ message: 'O id da medição e obrigatório' })
  @IsUUID('all', { message: 'O id da medição deve ser um uuid valido' })
  measure_uuid: string;

  @IsNumber()
  confirmed_value: number;
}
