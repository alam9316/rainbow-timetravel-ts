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

    let record: StoredRecord | undefined;

    const row = db
      .prepare(
        'SELECT id, data FROM records_versioned WHERE id = ? ORDER BY version DESC LIMIT 1'
      )
      .get(id);

    if (row) {
      record = {
        id: row.id,
        data: JSON.parse(row.data)
      };
    } else {
      // fallback to old table
      const fallback = db
        .prepare('SELECT id, data FROM records WHERE id = ?')
        .get(id);

      if (!fallback) {
        return res
          .status(404)
          .json({ error: `record of id ${id} does not exist` });
      }

      // migrate on read
      db.prepare(
        `
        INSERT INTO records_versioned (id, version, data, created_at)
        VALUES (?, 1, ?, datetime('now'))
        `
      ).run(fallback.id, fallback.data);

      record = {
        id: fallback.id,
        data: JSON.parse(fallback.data)
      };
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

    const insertRecord = db.transaction(() => {
      let row = db
        .prepare(
          `
          SELECT data, version
          FROM records_versioned
          WHERE id = ?
          ORDER BY version DESC
          LIMIT 1
          `
        )
        .get(id);

      if (!row) {
        const fallback = db
          .prepare('SELECT data FROM records WHERE id = ?')
          .get(id);

        if (fallback) {
          db.prepare(
            `
            INSERT INTO records_versioned (id, version, data, created_at)
            VALUES (?, 1, ?, datetime('now'))
            `
          ).run(id, fallback.data);

          row = { data: fallback.data, version: 1 };
        }
      }

      const currentData: RecordData = row ? JSON.parse(row.data) : {};
      const newData: RecordData = { ...currentData };

      for (const key in req.body) {
        if (req.body[key] === null) {
          delete newData[key];
        } else {
          newData[key] = req.body[key];
        }
      }

      const newVersion = row ? row.version + 1 : 1;

      db.prepare(
        `
        INSERT INTO records_versioned (id, version, data, created_at)
        VALUES (?, ?, ?, datetime('now'))
        `
      ).run(id, newVersion, JSON.stringify(newData));

      // v1 response shape
      return { id, data: newData };
    });

    const record = insertRecord();
    res.status(201).json(record);
  }
);

export default router;
