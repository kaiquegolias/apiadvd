const express = require("express");
const cors = require("cors");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const multer = require("multer"); // Adicionado para lidar com upload de arquivos
const path = require("path");

const app = express();
const port = 3000;

// Configuração do multer para upload de PDFs
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Pasta onde os arquivos serão salvos
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // Nome do arquivo
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (path.extname(file.originalname) !== '.pdf') {
      return cb(new Error('Apenas arquivos PDF são permitidos'))
    }
    cb(null, true)
  }
});

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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documentos:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo PDF para upload
 *     responses:
 *       200:
 *         description: Documentos recebidos com sucesso
 */
app.post("/orcamento", upload.single('documentos'), (req, res) => {
  const orcamento = {
    ...req.body,
    arquivo: req.file ? req.file.filename : null
  };
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