import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.header('x-request-id') || uuidv4();
    
    // Attach to request for logging/context
    req.requestId = requestId;
    
    // Attach to response header
    res.setHeader('X-Request-Id', requestId);
    
    next();
  }
}
