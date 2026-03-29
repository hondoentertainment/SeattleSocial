import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

type ValidationSchema = Record<string, FieldRule>;

interface FieldRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
}

/**
 * Request body validation middleware factory.
 * Returns middleware that validates req.body against the provided schema.
 */
export function validate(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(rules.message || `${field} is required.`);
        continue;
      }

      if (value === undefined || value === null) continue;

      if (rules.type === 'array') {
        if (!Array.isArray(value)) {
          errors.push(`${field} must be an array.`);
          continue;
        }
      } else if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be a ${rules.type}.`);
        continue;
      }

      if (rules.minLength !== undefined && typeof value === 'string' && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters.`);
      }

      if (rules.maxLength !== undefined && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${field} must be at most ${rules.maxLength} characters.`);
      }

      if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}.`);
      }

      if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
        errors.push(`${field} must be at most ${rules.max}.`);
      }

      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(rules.message || `${field} has an invalid format.`);
      }
    }

    if (errors.length > 0) {
      next(new AppError(400, errors.join(' ')));
      return;
    }

    next();
  };
}
