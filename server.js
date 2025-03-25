const express = require("express");
const cors = require("cors");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;

// Permitir CORS de qualquer origem (recomendado para produção restringir)
app.use(cors());

app.use(express.json());

let orcamentos = [];

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Orçamentos Jurídicos",
      version: "1.0.0",
      description: "API para envio e recebimento de orçamentos de processos jurídicos",
    },
  },
  apis: ["./server.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /orcamento:
 *   post:
 *     summary: Enviar documentos para análise jurídica
 *     description: O usuário envia os documentos necessários para um processo trabalhista
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentos:
 *                 type: object
 *                 properties:
 *                   identidade_rg:
 *                     type: string
 *                   cpf:
 *                     type: string
 *                   titulo_eleitor:
 *                     type: string
 *                     nullable: true
 *                   pis_pasep_nit:
 *                     type: string
 *                   comprovante_residencia:
 *                     type: string
 *                   carteira_trabalho:
 *                     type: string
 *                   contrato_trabalho:
 *                     type: string
 *                     nullable: true
 *                   holerites:
 *                     type: array
 *                     items:
 *                       type: string
 *                   comprovantes_pagamento:
 *                     type: array
 *                     items:
 *                       type: string
 *                   comunicacao_demissao:
 *                     type: string
 *                     nullable: true
 *                   recibos_ferias_13:
 *                     type: string
 *                   comprovante_fgts:
 *                     type: string
 *                   comprovante_horas_extras:
 *                     type: string
 *                   adicional_noturno:
 *                     type: string
 *                     nullable: true
 *                   avisos_previos:
 *                     type: string
 *                     nullable: true
 *                   comprovante_desvio_funcao:
 *                     type: string
 *                     nullable: true
 *                   testemunhas:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                         contato:
 *                           type: string
 *                   provas_adicionais:
 *                     type: array
 *                     items:
 *                       type: string
 *                   cnpj_empresa:
 *                     type: string
 *                   nome_empregador:
 *                     type: string
 *                   endereco_empresa:
 *                     type: string
 *                   contato_rh:
 *                     type: string
 *     responses:
 *       200:
 *         description: Documentos recebidos com sucesso
 */
app.post("/orcamento", (req, res) => {
  const orcamento = req.body;
  orcamentos.push(orcamento);
  res.status(200).json({ message: "Documentos recebidos com sucesso!", data: orcamento });
});

/**
 * @swagger
 * /orcamento:
 *   get:
 *     summary: Listar todos os documentos enviados
 *     description: O advogado pode visualizar os documentos cadastrados pelos usuários
 *     responses:
 *       200:
 *         description: Lista de documentos cadastrados
 */
app.get("/orcamento", (req, res) => {
  res.status(200).json(orcamentos);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(`Swagger disponível em http://localhost:${port}/api-docs`);
});
