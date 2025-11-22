import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const corsOrigin = process.env.CORS_ORIGIN?.trim();
    const origin = req.headers.origin;
    
    // Determine allowed origin - ALWAYS set a value to prevent CORS errors
    let allowedOrigin: string;
    
    if (corsOrigin === '*') {
      // Allow any origin when CORS_ORIGIN is *
      allowedOrigin = origin || '*';
    } else if (corsOrigin) {
      // Check if the request origin is in the allowed list
      const allowedOrigins = corsOrigin.split(',').map(o => o.trim());
      if (origin && allowedOrigins.includes(origin)) {
        allowedOrigin = origin;
      } else {
        // Fallback to first allowed origin or use the origin if it's in defaults
        const defaultOrigins = [
          'https://feedin.up.railway.app',
          'http://localhost:4200',
          'http://127.0.0.1:4200',
        ];
        if (origin && defaultOrigins.includes(origin)) {
          allowedOrigin = origin;
        } else if (allowedOrigins.length > 0) {
          allowedOrigin = allowedOrigins[0];
        } else {
          // Last resort: use the request origin or default
          allowedOrigin = origin || 'https://feedin.up.railway.app';
        }
      }
    } else {
      // Default: check against known origins, but always set something
      const defaultOrigins = [
        'https://feedin.up.railway.app',
        'http://localhost:4200',
        'http://127.0.0.1:4200',
      ];
      if (origin && defaultOrigins.includes(origin)) {
        allowedOrigin = origin;
      } else {
        // Always set a default origin to prevent CORS errors
        allowedOrigin = origin || 'https://feedin.up.railway.app';
      }
    }
    
    // ALWAYS set CORS headers - this is critical for preventing CORS errors on 404s
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, Accept, Origin, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    next();
  }
}

