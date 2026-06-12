import { Router } from 'express';
import { z } from 'zod';
import { requireRoles } from '../middleware/authz';
import { getCelebrityRateLimit, resolveRateLimit } from '../middleware/rateLimit';
import {
  getCelebrityByIdRequestSchema,
  resolveCelebrityRequestSchema
} from '../models/celebrityProfile';
import { getCelebrityProfileById, resolveCelebrityIdentity } from '../services/profileAssembler';

const resolveResponseSchema = z.object({
  identity_status: z.union([z.literal('manual_review_required'), z.literal('resolved')])
});

export const celebritiesRouter = Router();

celebritiesRouter.get('/:id', getCelebrityRateLimit, (req, res, next) => {
  try {
    const parsedRequest = getCelebrityByIdRequestSchema.parse({
      params: req.params,
      query: req.query
    });

    const profile = getCelebrityProfileById(parsedRequest.params.id);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
});

celebritiesRouter.post('/resolve', resolveRateLimit, requireRoles('reviewer', 'admin'), (req, res, next) => {
  try {
    const parsedBody = resolveCelebrityRequestSchema.parse(req.body);
    const result = resolveCelebrityIdentity(parsedBody);
    const payload = resolveResponseSchema.parse(result);

    if (payload.identity_status === 'manual_review_required') {
      res.status(202).json(payload);
      return;
    }

    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
});
