import { Global, Module } from '@nestjs/common';
import { GoogleGeminiService } from './google-gemini.service';

@Global()
@Module({
  providers: [GoogleGeminiService],
  exports: [GoogleGeminiService],
})
export class GoogleGeminiModule {}
