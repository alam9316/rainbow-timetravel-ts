import type { Request, Response, NextFunction } from 'express';

function validateIdParam(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const numId = Number(id);

  if (!Number.isInteger(numId) || numId <= 0) {
    return res
      .status(400)
      .json({ error: 'invalid id; id must be a positive number' });
  }

  next();
}

function validateJsonBody(req: Request, res: Response, next: NextFunction) {
  if (
    typeof req.body !== 'object' ||
    req.body === null ||
    Array.isArray(req.body)
  ) {
    return res.status(400).json({ error: 'request body must be JSON object' });
  }
  next();
}

export { validateIdParam, validateJsonBody };
