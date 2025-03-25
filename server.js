const express = require("express");
const cors = require("cors");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const multer = require("multer");
const path = require("path");

const app = express();
const port = 3000;

// Configuração do multer para upload de PDFs
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'documento_pdf' && path.extname(file.originalname) !== '.pdf') {
      return cb(new Error('Apenas arquivos PDF são permitidos'))
    }
    cb(null, true)
  }
});

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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               telefone:
 *                 type: string
 *               documento_pdf:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo PDF para upload
 *               dados_adicionais:
 *                 type: string
 *                 description: JSON string com os dados adicionais
 *     responses:
 *       200:
 *         description: Documentos e dados recebidos com sucesso
 */
app.post("/orcamento", upload.single('documento_pdf'), (req, res) => {
  try {
    const { nome, email, telefone, dados_adicionais } = req.body;
    
    let dadosExtras = {};
    try {
      dadosExtras = dados_adicionais ? JSON.parse(dados_adicionais) : {};
    } catch (e) {
      console.error("Erro ao parsear dados_adicionais:", e);
    }

    const orcamento = {
      infoBasicas: { nome, email, telefone },
      ...dadosExtras,
      arquivo: req.file ? req.file.filename : null,
      dataRecebimento: new Date()
    };

    orcamentos.push(orcamento);
    
    res.status(200).json({ 
      message: "Documentos e dados recebidos com sucesso!", 
      data: orcamento 
    });
  } catch (error) {
    console.error("Erro no processamento:", error);
    res.status(500).json({ error: "Erro ao processar a solicitação" });
  }
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