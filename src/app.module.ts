import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MeasuresModule } from './measures/measures.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [MeasuresModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
