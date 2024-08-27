import { Module } from '@nestjs/common';
import { MeasuresModule } from './measures/measures.module';
import { PrismaModule } from './prisma/prisma.module';
import { GoogleGeminiModule } from './google-gemini/google-gemini.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MeasuresModule,
    PrismaModule,
    GoogleGeminiModule,
    ConfigModule.forRoot(),
  ],
})
export class AppModule {}
