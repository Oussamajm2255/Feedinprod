import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Ensure CORS headers are set even for errors
    this.setCorsHeaders(request, response);

    const exceptionResponse = exception.getResponse();
    const error = typeof exceptionResponse === 'string' 
      ? { message: exceptionResponse }
      : exceptionResponse;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: error,
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      JSON.stringify(errorResponse),
    );

    response.status(status).json(errorResponse);
  }

  private setCorsHeaders(request: Request, response: Response) {
    const corsOrigin = process.env.CORS_ORIGIN?.trim();
    const origin = request.headers.origin;
    
    let allowedOrigin: string | undefined;
    
    if (corsOrigin === '*') {
      allowedOrigin = origin || '*';
    } else if (corsOrigin) {
      const allowedOrigins = corsOrigin.split(',').map(o => o.trim());
      if (origin && allowedOrigins.includes(origin)) {
        allowedOrigin = origin;
      } else {
        const defaultOrigins = ['https://feedin.up.railway.app', 'http://localhost:4200', 'http://127.0.0.1:4200'];
        if (origin && defaultOrigins.includes(origin)) {
          allowedOrigin = origin;
        } else if (allowedOrigins.length > 0) {
          allowedOrigin = allowedOrigins[0];
        }
      }
    } else {
      const defaultOrigins = ['https://feedin.up.railway.app', 'http://localhost:4200', 'http://127.0.0.1:4200'];
      if (origin && defaultOrigins.includes(origin)) {
        allowedOrigin = origin;
      }
    }
    
    if (allowedOrigin) {
      response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    }
    response.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, Accept, Origin, X-Requested-With');
    response.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Ensure CORS headers are set even for errors
    this.setCorsHeaders(request, response);

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: typeof message === 'string' ? { message } : message,
    };

    // Log full error details for debugging
    if (exception instanceof Error) {
      this.logger.error(
        `${request.method} ${request.url} - ${exception.message}`,
        exception.stack,
      );
      // Also log the error message in the response for development
      if (process.env.NODE_ENV !== 'production') {
        errorResponse.error = {
          ...(typeof message === 'string' ? { message } : message),
          stack: exception.stack,
        };
      }
    } else {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception,
      );
    }

    response.status(status).json(errorResponse);
  }

  private setCorsHeaders(request: Request, response: Response) {
    const corsOrigin = process.env.CORS_ORIGIN?.trim();
    const origin = request.headers.origin;
    
    let allowedOrigin: string | undefined;
    
    if (corsOrigin === '*') {
      allowedOrigin = origin || '*';
    } else if (corsOrigin) {
      const allowedOrigins = corsOrigin.split(',').map(o => o.trim());
      if (origin && allowedOrigins.includes(origin)) {
        allowedOrigin = origin;
      } else {
        const defaultOrigins = ['https://feedin.up.railway.app', 'http://localhost:4200', 'http://127.0.0.1:4200'];
        if (origin && defaultOrigins.includes(origin)) {
          allowedOrigin = origin;
        } else if (allowedOrigins.length > 0) {
          allowedOrigin = allowedOrigins[0];
        }
      }
    } else {
      const defaultOrigins = ['https://feedin.up.railway.app', 'http://localhost:4200', 'http://127.0.0.1:4200'];
      if (origin && defaultOrigins.includes(origin)) {
        allowedOrigin = origin;
      }
    }
    
    if (allowedOrigin) {
      response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    }
    response.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, Accept, Origin, X-Requested-With');
    response.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}
