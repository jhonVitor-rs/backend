import { BadRequestException, Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class GoogleGeminiService {
  private genAI: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
  }

  async uploadImage(imageBase64: string) {
    try {
      const tempFilePath = await this.base64ToTempFile(imageBase64);
      const uploadResponse = await this.fileManager.uploadFile(tempFilePath, {
        mimeType: 'image/jpeg',
        displayName: 'Upload Image',
      });

      const resutl = await this.getMeasureValue(
        uploadResponse.file.mimeType,
        uploadResponse.file.uri,
      );

      await fs.promises.unlink(tempFilePath);
      return {
        measure_value: parseFloat(resutl.replace(',', '.')),
        image_url: uploadResponse.file.uri,
      };
    } catch (error) {
      // Tratamento de erro
      console.error(error);
      throw new Error('Erro ao processar a imagem com a API Gemini');
    }
  }

  private async base64ToTempFile(image: string) {
    const buffer = Buffer.from(image, 'base64');
    const tempFilePath = path.join(__dirname, `temp-${uuidv4()}.jpeg`);
    await fs.promises.writeFile(tempFilePath, buffer);
    return tempFilePath;
  }

  private async getMeasureValue(mimeType: string, fileUri: string) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const resutl = await model.generateContent([
        {
          fileData: {
            mimeType,
            fileUri,
          },
        },
        { text: 'Qual o valor númérico da medição nesta imagem?' },
      ]);

      return resutl.response.text().match(/\d+([.,]\d+)?/)[0];
    } catch (error) {
      throw new BadRequestException({
        error_code: 'INVALID_DATA',
        error_description: 'Erro ao gerar a medição com base na imagem',
      });
    }
  }
}
