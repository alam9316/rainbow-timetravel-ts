import { Router } from 'express';
import type { Request, Response } from 'express';
import { validateIdParam, validateJsonBody } from '../middleware/validators.ts';
import db from '../utils/db.ts';

const router = Router();

type RecordData = Record<string, unknown>;

type StoredRecord = {
  id: number;
  data: RecordData;
};

router.get(
  '/:id',
  validateIdParam,
  (
    req: Request<{ id: string }>,
    res: Response<StoredRecord | { error: string }>
  ) => {
    const id = Number(req.params.id);
    const row = db.prepare('SELECT * FROM records WHERE id = ?').get(id);

    if (!row) {
      return res
        .status(400)
        .json({ error: `record of id ${id} does not exist` });
    }

    const record: StoredRecord = { id: row.id, data: JSON.parse(row.data) };
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
    const row = db.prepare('SELECT * FROM records WHERE id = ?').get(id);
    const currentData: RecordData = row ? JSON.parse(row.data) : {};
    const newData: RecordData = { ...currentData };

    for (const key in req.body) {
      if (req.body[key] === null) {
        delete newData[key];
      } else {
        newData[key] = req.body[key];
      }
    }

    const record: StoredRecord = { id, data: newData };

    db.prepare(
      'INSERT INTO records (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data'
    ).run(id, JSON.stringify(newData));

    res.status(201).json(record);
  }
);

export default router;
