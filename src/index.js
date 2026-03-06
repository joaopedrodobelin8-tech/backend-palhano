import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import Routes
import publicRoutes from './routes/public.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();

const app = express();

// Middlewares Globais
app.use(helmet()); // Segurança HTTP
app.use(cors());   // Permite requisições do frontend
app.use(express.json()); // Permite ler JSON no req.body

// Rotas da API
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

// Tratamento de rota não encontrada
app.use((req, res, next) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Inicialização do Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
