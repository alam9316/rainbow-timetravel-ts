import { Router } from 'express';
import type { Request, Response } from 'express';
import { validateIdParam, validateJsonBody } from '../middleware/validators.ts';

const router = Router();

type RecordData = Record<string, unknown>;

type StoredRecord = {
  id: number;
  data: RecordData;
};

const STORED_RECORDS = new Map<number, StoredRecord>();

router.get(
  '/:id',
  validateIdParam,
  (
    req: Request<{ id: string }>,
    res: Response<StoredRecord | { error: string }>
  ) => {
    const id = Number(req.params.id);
    const record = STORED_RECORDS.get(id);

    if (!record) {
      return res
        .status(400)
        .json({ error: `record of id ${id} does not exist` });
    }

    res.json(record);
  }
);

router.post(
  '/:id',
  validateIdParam,
  validateJsonBody,
  (
    req: Request<{ id: string }, StoredRecord, RecordData>,
    res: Response<StoredRecord>
  ) => {
    const id = Number(req.params.id);
    const currentData = STORED_RECORDS.get(id)?.data || {};
    const newData: RecordData = { ...currentData };

    for (const key in req.body) {
      if (req.body[key] === null) {
        delete newData[key];
      } else {
        newData[key] = req.body[key];
      }
    }

    const record: StoredRecord = { id, data: newData };
    STORED_RECORDS.set(id, record);

    res.status(201).json(record);
  }
);

export default router;
