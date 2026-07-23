import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    errors?: Record<string, string>;
  };
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error('Error:', error);

  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message,
        statusCode: error.statusCode,
      },
    };

    if (error instanceof ValidationError && error.errors) {
      response.error.errors = error.errors;
    }

    res.status(error.statusCode).json(response);
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      statusCode: 500,
    },
  });
};
