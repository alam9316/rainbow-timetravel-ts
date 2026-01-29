import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  validateIdParam,
  validateJsonBody,
  validateVersionParam
} from '../middleware/validators.ts';
import db from '../utils/db.ts';

const router = Router();

type RecordData = Record<string, unknown>;

type VersionedRecord = {
  id: number;
  version: number;
  data: RecordData;
  created_at: string; // original record created (version 1)
  updated_at: string; // timestamp for this returned version
};

/**
 * Lastest record or optional record at a specific timestamp
 */
router.get(
  '/:id',
  validateIdParam,
  (
    req: Request<{ id: string }>,
    res: Response<VersionedRecord | { error: string }>
  ) => {
    const id = Number(req.params.id);
    const timestamp =
      (req.query.timestamp as string) || new Date().toISOString();

    const row = db
      .prepare(
        `
      SELECT id, version, data, created_at
      FROM records_versioned
      WHERE id = ? AND created_at <= ?
      ORDER BY version DESC
      LIMIT 1
      `
      )
      .get(id, timestamp);

    if (!row) {
      return res.status(404).json({ error: `record of id ${id} not found` });
    }

    const first = db
      .prepare(
        `SELECT created_at FROM records_versioned WHERE id = ? ORDER BY version ASC LIMIT 1`
      )
      .get(id);

    res.json({
      id: row.id,
      version: row.version,
      data: JSON.parse(row.data),
      created_at: first ? first.created_at : row.created_at,
      updated_at: row.created_at
    });
  }
);

/**
 * GET specific version of a record
 */
router.get(
  '/:id/versions/:version',
  validateIdParam,
  validateVersionParam,
  (
    req: Request<{ id: string; version: string }>,
    res: Response<VersionedRecord | { error: string }>
  ) => {
    const id = Number(req.params.id);
    const version = Number(req.params.version);

    if (!Number.isInteger(version) || version <= 0) {
      return res.status(400).json({ error: 'invalid version parameter' });
    }

    const row = db
      .prepare(
        `
      SELECT id, version, data, created_at
      FROM records_versioned
      WHERE id = ? AND version = ?
      `
      )
      .get(id, version);

    if (!row) {
      return res
        .status(404)
        .json({ error: `version ${version} for id ${id} not found` });
    }

    const first = db
      .prepare(
        `SELECT created_at FROM records_versioned WHERE id = ? ORDER BY version ASC LIMIT 1`
      )
      .get(id);

    res.json({
      id: row.id,
      version: row.version,
      data: JSON.parse(row.data),
      created_at: first ? first.created_at : row.created_at,
      updated_at: row.created_at
    });
  }
);

/**
 * LIST all versions
 */
router.get(
  '/:id/versions',
  validateIdParam,
  (req: Request<{ id: string }>, res: Response<VersionedRecord[]>) => {
    const id = Number(req.params.id);

    const rows = db
      .prepare(
        `
      SELECT id, version, data, created_at
      FROM records_versioned
      WHERE id = ?
      ORDER BY version DESC
      `
      )
      .all(id) as {
      id: number;
      version: number;
      data: string;
      created_at: string;
    }[];

    const first = db
      .prepare(
        `SELECT created_at FROM records_versioned WHERE id = ? ORDER BY version ASC LIMIT 1`
      )
      .get(id) as { created_at: string } | undefined;

    res.json(
      rows.map((row) => ({
        id: row.id,
        version: row.version,
        data: JSON.parse(row.data),
        created_at: first ? first.created_at : row.created_at,
        updated_at: row.created_at
      }))
    );
  }
);

/**
 * POST (always creates new version)
 */
router.post(
  '/:id',
  validateIdParam,
  validateJsonBody,
  (
    req: Request<{ id: string }, VersionedRecord, RecordData>,
    res: Response<VersionedRecord>
  ) => {
    const id = Number(req.params.id);

    const createVersion = db.transaction(() => {
      const latest = db
        .prepare(
          `
        SELECT version, data
        FROM records_versioned
        WHERE id = ?
        ORDER BY version DESC
        LIMIT 1
        `
        )
        .get(id);

      const baseData: RecordData = latest ? JSON.parse(latest.data) : {};
      const newData: RecordData = { ...baseData };

      for (const key in req.body) {
        if (req.body[key] === null) {
          delete newData[key];
        } else {
          newData[key] = req.body[key];
        }
      }

      const newVersion = latest ? latest.version + 1 : 1;

      db.prepare(
        `
        INSERT INTO records_versioned (id, version, data, created_at)
        VALUES (?, ?, ?, datetime('now'))
        `
      ).run(id, newVersion, JSON.stringify(newData));

      const inserted = db
        .prepare(
          `SELECT created_at FROM records_versioned WHERE id = ? AND version = ? LIMIT 1`
        )
        .get(id, newVersion) as { created_at: string };

      const first = db
        .prepare(
          `SELECT created_at FROM records_versioned WHERE id = ? ORDER BY version ASC LIMIT 1`
        )
        .get(id) as { created_at: string } | undefined;

      return {
        id,
        version: newVersion,
        data: newData,
        created_at: first ? first.created_at : inserted.created_at,
        updated_at: inserted.created_at
      };
    });

    const record = createVersion();
    res.status(201).json(record);
  }
);

export default router;
