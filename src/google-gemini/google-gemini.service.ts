import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
@Injectable()
export class GoogleGeminiService {
  private genAI: GoogleGenerativeAI;
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async uploadImage(imageBase64: string) {
    try {
      const prompt = 'Extract the numeric value from the image.';

      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const generatedContent = await model.generateContent([
        prompt,
        imageBase64,
      ]);

      return generatedContent.response.text();
    } catch (error) {}
  }
}
