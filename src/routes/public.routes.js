import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import supabase from '../config/supabase.js';

const router = Router();

// Limiting strict on public endpoints to prevent spam
const submitLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 submissions per windowMs
    message: { error: 'Muitas simulações realizadas. Tente novamente mais tarde.' }
});

router.post('/simulacoes', submitLimiter, async (req, res) => {
    try {
        const {
            tipo_consorcio,
            valor_credito,
            valor_parcela,
            nome,
            whatsapp,
            realizou_cadastro
        } = req.body;

        // Validação básica
        if (!tipo_consorcio || !valor_credito || !valor_parcela) {
            return res.status(400).json({ error: 'Dados obrigatórios faltando' });
        }

        const { data, error } = await supabase
            .from('simulacoes')
            .insert([{
                tipo_consorcio,
                valor_credito,
                valor_parcela,
                nome: nome || null,
                whatsapp: whatsapp || null,
                realizou_cadastro: !!realizou_cadastro
            }])
            .select();

        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao salvar a simulação no banco' });
        }

        res.status(201).json({ message: 'Simulação salva com sucesso', simulacao: data[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
