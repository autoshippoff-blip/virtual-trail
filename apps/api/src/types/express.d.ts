import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      tenant?: any; // We can type this better later
    }
  }
}
