import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createObjectCsvStringifier } from 'csv-writer';
import supabase from '../config/supabase.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

// POST /admin/login
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !admin) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const isValid = await bcrypt.compare(senha, admin.senha_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email },
            process.env.JWT_SECRET || 'secret_dev_palhano_xxx',
            { expiresIn: '8h' }
        );

        res.json({ token, user: { email: admin.email } });
    } catch (err) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Todas as rotas abaixo requerem autenticação
router.use(authenticateToken);

// GET /admin/simulacoes
router.get('/simulacoes', async (req, res) => {
    try {
        let query = supabase.from('simulacoes').select('*').order('data_simulacao', { ascending: false });

        if (req.query.tipo_consorcio) {
            query = query.eq('tipo_consorcio', req.query.tipo_consorcio);
        }
        if (req.query.realizou_cadastro) {
            query = query.eq('realizou_cadastro', req.query.realizou_cadastro === 'true');
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar simulações' });
    }
});

// GET /admin/leads
router.get('/leads', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('simulacoes')
            .select('*')
            .eq('realizou_cadastro', true)
            .order('data_simulacao', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar leads' });
    }
});

// PATCH /admin/simulacoes/:id/contato
router.patch('/simulacoes/:id/contato', async (req, res) => {
    try {
        const { id } = req.params;
        const { contatado } = req.body;

        const { data, error } = await supabase
            .from('simulacoes')
            .update({ contatado })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error("Erro ao atualizar status de contato:", err);
        res.status(500).json({ error: 'Erro ao atualizar status de contato do lead no Supabase' });
    }
});

// GET /admin/stats
router.get('/stats', async (req, res) => {
    try {
        const { data, error } = await supabase.from('simulacoes').select('*');
        if (error) throw error;

        const total_simulacoes = data.length;
        const total_leads = data.filter(s => s.realizou_cadastro).length;

        let volume_total = 0;
        const simulacoes_por_tipo = {};

        data.forEach(s => {
            volume_total += Number(s.valor_credito);
            if (!simulacoes_por_tipo[s.tipo_consorcio]) {
                simulacoes_por_tipo[s.tipo_consorcio] = 0;
            }
            simulacoes_por_tipo[s.tipo_consorcio]++;
        });

        res.json({
            total_simulacoes,
            total_leads,
            volume_total,
            simulacoes_por_tipo
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// GET /admin/export
router.get('/export', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('simulacoes')
            .select('*')
            .order('data_simulacao', { ascending: false });

        if (error) throw error;

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'data_simulacao', title: 'Data' },
                { id: 'tipo_consorcio', title: 'Categoria' },
                { id: 'valor_credito', title: 'Credito' },
                { id: 'valor_parcela', title: 'Parcela' },
                { id: 'realizou_cadastro', title: 'Cadastrou' },
                { id: 'nome', title: 'Nome' },
                { id: 'whatsapp', title: 'WhatsApp' }
            ]
        });

        const records = data.map(row => ({
            data_simulacao: new Date(row.data_simulacao).toLocaleString('pt-BR'),
            tipo_consorcio: row.tipo_consorcio,
            valor_credito: row.valor_credito,
            valor_parcela: row.valor_parcela,
            realizou_cadastro: row.realizou_cadastro ? 'Sim' : 'Nao',
            nome: row.nome || '-',
            whatsapp: row.whatsapp || '-'
        }));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');

        const headerRaw = csvStringifier.getHeaderString();
        const bodyRaw = csvStringifier.stringifyRecords(records);
        res.send(headerRaw + bodyRaw);

    } catch (err) {
        res.status(500).json({ error: 'Erro ao exportar CSV' });
    }
});

export default router;
