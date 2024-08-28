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
  await app.listen(3000);
}
bootstrap();
