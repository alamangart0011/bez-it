import { Router } from 'express';
import { bezItLeadsService } from '../services/bez-it-leads.service.js';
import { bezItCabinetAuth } from '../middleware/bez-it-cabinet-auth.js';
import { sendError } from '../lib/http-error.js';

function ctxFromReq(req) {
  const fwd = req.headers['x-forwarded-for'];
  const ipAddr = (fwd && String(fwd).split(',')[0].trim()) || req.ip || '';
  return {
    userAgent: req.headers['user-agent'] || '',
    ipAddr
  };
}

export const bezItLeadsPublicRouter = Router();

bezItLeadsPublicRouter.post('/', async (req, res) => {
  try {
    const result = await bezItLeadsService.submitLead(req.body, ctxFromReq(req));
    res.status(201).json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

bezItLeadsPublicRouter.post('/events', async (req, res) => {
  try {
    const result = await bezItLeadsService.logLandingEvent(req.body, ctxFromReq(req));
    res.status(202).json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

export const bezItCabinetRouter = Router();
bezItCabinetRouter.use(bezItCabinetAuth);

bezItCabinetRouter.get('/leads', async (req, res) => {
  try {
    res.json(await bezItLeadsService.listLeads(req.query));
  } catch (error) {
    return sendError(res, error);
  }
});

bezItCabinetRouter.get('/leads/:id', async (req, res) => {
  try {
    res.json(await bezItLeadsService.getLead(Number(req.params.id)));
  } catch (error) {
    return sendError(res, error);
  }
});

bezItCabinetRouter.patch('/leads/:id', async (req, res) => {
  try {
    res.json(await bezItLeadsService.updateLeadStatus(Number(req.params.id), req.body));
  } catch (error) {
    return sendError(res, error);
  }
});
