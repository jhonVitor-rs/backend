FROM node:21-slim

#  Instala as dependências necessárias
RUN apt update && apt install -y openssl procps

# Instala o NestJS CLI globalmente
RUN npm install -g @nestjs/cli@10.3.2

# Define o diretório de trabalho
WORKDIR /home/node/app

# Copia os arquivos package.json e package-lock.json
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia o restante do código
COPY . .

# Define o usuário como node
USER node

# Comando para executar os testes
# CMD ["npm", "run", "test", "&&", "npm", "run", "start:dev"]

# Comando para iniciair a aplicação em modo de desenvolvimento
CMD ["npm", "run", "start:dev"]
