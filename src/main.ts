import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory(errors: ValidationError[]) {
        // Lançamento do erro personalizado caso haja um erro com os parametros passados no body
        // {
        //   "error_code": "INVALID_DATA",
        //   "error_description": {
        //     "field": [
        //       "error_type"
        //     ]
        //   }
        // }
        throw new BadRequestException({
          error_code: 'INVALID_DATA',
          error_description: errors.reduce((acc, err) => {
            acc[err.property] = Object.values(err.constraints);
            return acc;
          }, {}),
        });
      },
    }),
  );
  await app.listen(3000, () => {
    console.log('application listening on port http://localhost:3000');
  });
}
bootstrap();
