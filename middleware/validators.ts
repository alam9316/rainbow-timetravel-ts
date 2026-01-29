import type { Request, Response, NextFunction } from 'express';

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

const positiveIntParam =
  (paramName: string) => (req: Request, res: Response, next: NextFunction) => {
    const val = req.params[paramName];
    const num = Number(val);

    if (!Number.isInteger(num) || num <= 0) {
      return res.status(400).json({
        error: `invalid ${paramName}; ${paramName} must be a positive number`
      });
    }

    next();
  };

const validateIdParam = positiveIntParam('id');
const validateVersionParam = positiveIntParam('version');

export { validateIdParam, validateJsonBody, validateVersionParam };
