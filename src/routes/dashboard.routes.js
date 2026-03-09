import { Router } from 'express';
import supabase from '../config/supabase.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

// Dashboard routes require authentication and admin/manager roles
router.use(authenticateToken);
router.use(requireRole(['admin', 'manager']));

/**
 * GET /api/dashboard
 * High-level metrics for the dashboard matching Step 5 requirement.
 */
router.get('/dashboard', async (req, res, next) => {
    try {
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('*')
            .order('data_simulacao', { ascending: false });

        if (leadsError) throw leadsError;

        const { data: stages, error: stagesError } = await supabase
            .from('pipeline_stages')
            .select('*')
            .order('order', { ascending: true });

        if (stagesError) throw stagesError;

        const safeLeads = leads || [];
        const safeStages = stages || [];
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const total_leads = safeLeads.length;
        const leads_today = safeLeads.filter(r => {
            const d = new Date(r.data_simulacao).getTime();
            return d >= startOfDay;
        }).length;

        const pipeline = safeStages.map((stage, index) => ({
            id: stage.id,
            name: stage.name,
            color: stage.color,
            count: safeLeads.filter(l => {
                if (l.pipeline_stage_id === stage.id) return true;
                if (index === 0 && !l.pipeline_stage_id) return true;
                return false;
            }).length
        }));

        const recent_leads = safeLeads.slice(0, 5);

        // Calculate Trend (last 7 days)
        const leads_by_day = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
            const dayEnd = dayStart + 86400000;

            const count = safeLeads.filter(l => {
                const d = new Date(l.data_simulacao).getTime();
                return d >= dayStart && d < dayEnd;
            }).length;

            leads_by_day.push({ date: dateStr, count });
        }

        res.json({
            total_leads,
            leads_today,
            pipeline,
            recent_leads,
            leads_by_day
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/funnel
 */
router.get('/funnel', async (req, res, next) => {
    try {
        const { data: stages, error: stagesError } = await supabase
            .from('pipeline_stages')
            .select('*')
            .order('order', { ascending: true });
        if (stagesError) throw stagesError;

        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('pipeline_stage_id, valor_credito');
        if (leadsError) throw leadsError;

        const safeLeads = leads || [];
        const total = safeLeads.length || 1;

        const funnelData = (stages || []).map((stage, index) => {
            const stageLeads = safeLeads.filter(l => {
                if (l.pipeline_stage_id === stage.id) return true;
                if (index === 0 && !l.pipeline_stage_id) return true;
                return false;
            });
            return {
                name: stage.name,
                count: stageLeads.length,
                volume: stageLeads.reduce((sum, r) => sum + (Number(r.valor_credito) || 0), 0),
                percentage: parseFloat(((stageLeads.length / total) * 100).toFixed(1))
            };
        });

        res.json(funnelData);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/pipeline
 */
router.get('/pipeline', async (req, res, next) => {
    try {
        const { data: stages, error: stagesError } = await supabase.from('pipeline_stages').select('*').order('order', { ascending: true });
        if (stagesError) throw stagesError;

        const { data: leads, error: leadsError } = await supabase.from('leads').select('*').order('data_simulacao', { ascending: false });
        if (leadsError) throw leadsError;

        const pipelineData = (stages || []).map((stage, index) => ({
            ...stage,
            leads: (leads || []).filter(l => {
                if (l.pipeline_stage_id === stage.id) return true;
                if (index === 0 && !l.pipeline_stage_id) return true;
                return false;
            })
        }));

        res.json(pipelineData);
    } catch (err) {
        next(err);
    }
});

export default router;
