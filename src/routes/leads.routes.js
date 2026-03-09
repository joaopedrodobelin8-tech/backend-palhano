import { Router } from 'express';
import supabase from '../config/supabase.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*, pipeline_stages(name, color)')
            .order('data_simulacao', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('*, pipeline_stages(name, color)')
            .eq('id', id)
            .single();
        if (leadError) throw leadError;

        const { data: activities } = await supabase
            .from('activities')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false });

        res.json({ ...lead, activities: activities || [] });
    } catch (err) {
        next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const insertData = { ...req.body, assigned_to: req.user.id };

        // Auto-sync pipeline_stage_id if status is specified at creation
        if (req.body.status && STATUS_TO_STAGE[req.body.status]) {
            const stageName = STATUS_TO_STAGE[req.body.status];
            const { data: stages } = await supabase
                .from('pipeline_stages')
                .select('id')
                .eq('name', stageName)
                .limit(1);

            if (stages && stages.length > 0) {
                insertData.pipeline_stage_id = stages[0].id;
            }
        }

        const { data, error } = await supabase.from('leads').insert(insertData).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
});

const STATUS_TO_STAGE = {
    'novo': 'Novo Lead',
    'contato': 'Contato Iniciado',
    'negociacao': 'Em Negociação',
    'proposta': 'Proposta Enviada',
    'aguardando': 'Aguardando Cliente',
    'convertido': 'Convertido',
    'perdido': 'Perdido'
};

router.patch('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body, ultima_interacao: new Date().toISOString() };

        // Auto-sync pipeline_stage_id if status is updated
        if (req.body.status && STATUS_TO_STAGE[req.body.status]) {
            const stageName = STATUS_TO_STAGE[req.body.status];
            const { data: stages } = await supabase
                .from('pipeline_stages')
                .select('id')
                .eq('name', stageName)
                .limit(1);

            if (stages && stages.length > 0) {
                updateData.pipeline_stage_id = stages[0].id;
            }
        }

        const { data, error } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

export default router;
