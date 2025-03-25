const express = require("express");
const cors = require("cors");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

// Configuração do Multer para upload de PDFs
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos PDF são permitidos'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de 10MB por arquivo
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Banco de dados em memória
let orcamentos = [];

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Orçamentos Jurídicos",
      version: "1.0.0",
      description: "API para envio e recebimento de orçamentos de processos jurídicos com suporte a PDF e dados textuais",
    },
    servers: [
      {
        url: `http://localhost:${port}`
      }
    ],
  },
  apis: ["./server.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * components:
 *   schemas:
 *     Orcamento:
 *       type: object
 *       properties:
 *         dadosCliente:
 *           type: object
 *           properties:
 *             nome:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             telefone:
 *               type: string
 *             descricaoCaso:
 *               type: string
 *         documentos:
 *           type: object
 *           additionalProperties:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 fieldname:
 *                   type: string
 *                 originalname:
 *                   type: string
 *                 encoding:
 *                   type: string
 *                 mimetype:
 *                   type: string
 *                 destination:
 *                   type: string
 *                 filename:
 *                   type: string
 *                 path:
 *                   type: string
 *                 size:
 *                   type: integer
 *         metadata:
 *           type: object
 *           properties:
 *             dataEnvio:
 *               type: string
 *               format: date-time
 *             ip:
 *               type: string
 */

/**
 * @swagger
 * /orcamento:
 *   post:
 *     summary: Envia dados textuais e documentos PDF para análise jurídica
 *     tags: [Orçamento]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome completo do cliente
 *               email:
 *                 type: string
 *                 format: email
 *                 description: E-mail do cliente
 *               telefone:
 *                 type: string
 *                 description: Telefone do cliente
 *               descricaoCaso:
 *                 type: string
 *                 description: Descrição detalhada do caso
 *               identidade_rg:
 *                 type: string
 *                 format: binary
 *                 description: Documento de identidade ou RG (PDF)
 *               cpf:
 *                 type: string
 *                 format: binary
 *                 description: CPF (PDF)
 *               carteira_trabalho:
 *                 type: string
 *                 format: binary
 *                 description: Carteira de trabalho (PDF)
 *               comprovante_residencia:
 *                 type: string
 *                 format: binary
 *                 description: Comprovante de residência (PDF)
 *               holerites:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Holerites (PDFs)
 *     responses:
 *       200:
 *         description: Dados e documentos recebidos com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Orcamento'
 *       400:
 *         description: Erro no processamento dos dados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
app.post("/orcamento", upload.fields([
  { name: 'identidade_rg', maxCount: 1 },
  { name: 'cpf', maxCount: 1 },
  { name: 'carteira_trabalho', maxCount: 1 },
  { name: 'comprovante_residencia', maxCount: 1 },
  { name: 'holerites', maxCount: 10 }
]), (req, res) => {
  try {
    // Validação básica dos campos textuais
    if (!req.body.nome || !req.body.email || !req.body.telefone) {
      throw new Error('Nome, email e telefone são obrigatórios');
    }

    const orcamento = {
      dadosCliente: {
        nome: req.body.nome,
        email: req.body.email,
        telefone: req.body.telefone,
        descricaoCaso: req.body.descricaoCaso || ''
      },
      documentos: req.files,
      metadata: {
        dataEnvio: new Date().toISOString(),
        ip: req.ip
      }
    };

    orcamentos.push(orcamento);

    res.status(200).json({
      message: "Dados e documentos recebidos com sucesso!",
      data: orcamento
    });
  } catch (error) {
    res.status(400).json({
      message: "Erro ao processar solicitação",
      error: error.message
    });
  }
});

/**
 * @swagger
 * /orcamento:
 *   get:
 *     summary: Lista todos os orçamentos cadastrados
 *     tags: [Orçamento]
 *     responses:
 *       200:
 *         description: Lista de orçamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Orcamento'
 */
app.get("/orcamento", (req, res) => {
  res.status(200).json(orcamentos);
});

/**
 * @swagger
 * /orcamento/{id}:
 *   get:
 *     summary: Obtém um orçamento específico pelo ID
 *     tags: [Orçamento]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do orçamento
 *     responses:
 *       200:
 *         description: Orçamento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Orcamento'
 *       404:
 *         description: Orçamento não encontrado
 */
app.get("/orcamento/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (id >= 0 && id < orcamentos.length) {
    res.status(200).json(orcamentos[id]);
  } else {
    res.status(404).json({ message: "Orçamento não encontrado" });
  }
});

// Rota para servir arquivos PDF
app.use('/pdf', express.static('uploads'));

// Middleware de erro
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ message: "Erro no upload de arquivo", error: err.message });
  } else {
    res.status(500).json({ message: "Erro interno no servidor", error: err.message });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(`Swagger disponível em http://localhost:${port}/api-docs`);
  console.log(`Arquivos PDF podem ser acessados em http://localhost:${port}/pdf/nome-do-arquivo`);
});