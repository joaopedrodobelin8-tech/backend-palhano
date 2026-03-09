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
        const { data, error } = await supabase.from('leads').insert({ ...req.body, assigned_to: req.user.id }).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
});

router.patch('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('leads').update({ ...req.body, ultima_interacao: new Date().toISOString() }).eq('id', id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

export default router;
