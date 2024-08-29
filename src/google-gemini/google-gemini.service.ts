import { Injectable, InternalServerErrorException } from '@nestjs/common';
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

  // Função para upload de arquivos para a API do Google Gemini
  async uploadImage(imageBase64: string) {
    try {
      const tempFilePath = await this.base64ToTempFile(imageBase64);
      const uploadResponse = await this.fileManager.uploadFile(tempFilePath, {
        mimeType: 'image/jpeg',
        displayName: 'Upload Image',
      });

      await fs.promises.unlink(tempFilePath);
      return {
        mime_type: uploadResponse.file.mimeType,
        image_url: uploadResponse.file.uri,
      };
    } catch (error) {
      // Tratamento de erro
      console.error(error);
      throw new InternalServerErrorException({
        error_code: 'INTERNAL_SERVER_ERROR',
        error_description: 'Erro ao fazer upload da imagem',
      });
    }
  }

  // Converção de base64 para uma imagem .jpeg
  private async base64ToTempFile(image: string) {
    const buffer = Buffer.from(image, 'base64');
    const tempFilePath = path.join(__dirname, `temp-${uuidv4()}.jpeg`);
    await fs.promises.writeFile(tempFilePath, buffer);
    return tempFilePath;
  }

  // Recuperação da descrição da imagem
  async getMeasureValue(mimeType: string, fileUri: string) {
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

      return parseInt(resutl.response.text().match(/\d+([.,]\d+)?/)[0]);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({
        error_code: 'INTERNAL_SERVER_ERROR',
        error_description: 'Erro ao gerar a medição com base na imagem',
      });
    }
  }
}
