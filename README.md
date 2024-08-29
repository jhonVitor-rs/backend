# Descrição

Projeto desenvolvido com nest, postgres sql e com a api do google gemini.
Consiste em um projeto desenvolvido como o intuito de ler uma imagem de medição de gas ou água e retornar o valor da medição, junto com um url temporário da imagem.

## Instalação

Não e preciso instalar nada para poder rodar a aplicação, apenas certifique-se de ter o docker instalado em sua maquiná, para mais detalhes da instalação do mesmo consulte a [documentação do docker](https://www.docker.com/).

Após o docker instaldo baixa o código com a cli do git com o seguinte comando:

```bash
$ git clone https://github.com/jhonVitor-rs/backend.git
```

Agora basta entrar dentro da pasta com o comando:

```bash
$ cd backend/
```

E rodar o comando:

```bash
$ docker compose up
```

Aguarde algusn minutos ate o container subir, em uma primeira tentativa e provavel que demore um pouco ate o mesmo baixar as imagens para os containers postgres e node.
Assim que identificar a seguinte frase em seu terminal:

```bash
$ nestjs-1  | application listening on port http://localhost:3000
```

Sua aplicação subiu com sucesso

## Acessando endpoints

A aplicação possui três endpoints.

- O primeiro, uma porta que aceita requisições POST para criação de novas medições disponivel em:
  -- http://localhost:3000
  Ela espera os seguintes argumentos no seu body:

  ```json
    {
      "image": "base64",
      "customer_code": "string",
      "measure_datetime": "datetime",
      "measure_type": "WATER" ou "GAS"
    }
  ```

  Ela possui um tempo de resposta longo devido a sua conexão com a api do google gemini, mas se bem sucedida sua requisição voce deve ter uma resposta semelhante a isto:

  ```json
    {
      "image_url": "string",
      "measure_value": integer,
      "measure_uuid": "string"
    }
  ```

- A segunda uma requisição do tipo GET disponivel em:
  -- http://localhost:3000/:customer_code/list?measure_type=water
  Ela espera um customer_code como parametro, que seria o id do usuário que registrou a medição, e e possivel enviar um measure_type podendo ser 'water' ou 'gas' para filtrar os resultados, mas este e opicional. Se bem sucedida sua requisição voce deve ter um resultado semelhante a:

  ```json
    {
      "customer_code": "string",
      "measures": [
        {
          "measure_uuid": "string",
          "measure_datetime": "string",
          "measure_type": "string",
          "has_confirmed": boolean,
          "image_url": "string",
        }
      ]
    }
  ```

- A terceira e uma requisição do tipo PATCH para confirmar se o valor da leitura está correta, ela está disponivel em:
  -- http://localhost:3000
  Ela espera um body com os seguites campos:
  ```json
    {
      "measure_uuid": "string",
      "comfirmed_value": integer,
    }
  ```
  Se bem sucedida você tera uma resposta semelhante a:
  ```json
  {
    "success": true
  }
  ```
