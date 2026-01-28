import type { Request, Response, NextFunction } from 'express';

export function validateIdParam(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { id } = req.params;
  const numId = Number(id);

  if (!Number.isInteger(numId) || numId <= 0) {
    return res
      .status(400)
      .json({ error: 'invalid id; id must be a positive number' });
  }

  next();
}
