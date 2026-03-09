import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import Routes
import publicRoutes from './routes/public.routes.js';
import adminRoutes from './routes/admin.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import leadsRoutes from './routes/leads.routes.js';

dotenv.config();

const app = express();

// Middlewares Globais
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Rotas da API
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api', dashboardRoutes); // dashboard: /api/dashboard, /api/funnel, /api/pipeline

// Tratamento de rota não encontrada
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Tratamento de erros globais
app.use((err, req, res, next) => {
    console.error('Erro:', err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Erro interno do servidor'
    });
});

// Inicialização do Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
