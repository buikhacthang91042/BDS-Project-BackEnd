import { ZodSchema } from "zod";
import { Request , Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      validateData?: unknown;
    }
  }
}
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues[0].message;
      return res.status(400).json({ message });
    }
    req.validateData = result.data;
    next();
  };
} 

