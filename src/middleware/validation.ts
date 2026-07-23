import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const fieldErrors: Record<string, string> = {};

    errors.array().forEach((error) => {
      if (error.type === 'field') {
        fieldErrors[error.path] = error.msg;
      }
    });

    const error = new ValidationError('Validation failed', fieldErrors);
    next(error);
    return;
  }

  next();
};
