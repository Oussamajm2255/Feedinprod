// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('🚀 Starting Smart Farm Backend...');
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`🗄️ Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
    logger.log(`🔌 MQTT Broker: ${process.env.MQTT_BROKER || 'Not set'}`);
    
    // Add a small delay to allow database to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    
    // ✅ CORS Configuration - SIMPLE and BULLETPROOF
    // Always allow the frontend domain explicitly
    const allowedOrigins = [
      'https://feedin.up.railway.app',
      'http://localhost:4200',
      'http://127.0.0.1:4200'
    ];
    
    // Add custom origins from env if provided
    const corsOrigin = process.env.CORS_ORIGIN;
    if (corsOrigin && corsOrigin !== '*') {
      corsOrigin.split(',').forEach(o => {
        const trimmed = o.trim();
        if (trimmed && !allowedOrigins.includes(trimmed)) {
          allowedOrigins.push(trimmed);
        }
      });
    }
    
    // Use function-based origin to handle wildcard mode properly
    const originCallback = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (same-origin, mobile apps, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // If CORS_ORIGIN is '*', allow all origins
      if (corsOrigin === '*') {
        logger.log(`✅ CORS: Allowing origin (wildcard): ${origin}`);
        callback(null, true);
        return;
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        logger.log(`✅ CORS: Allowed origin: ${origin}`);
        callback(null, true);
        return;
      }
      
      logger.warn(`❌ CORS: Blocked origin: ${origin}`);
      callback(null, false);
    };
    
    app.enableCors({
      origin: corsOrigin === '*' ? true : originCallback,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'Origin'],
      exposedHeaders: ['Authorization', 'Set-Cookie'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
      maxAge: 86400,
    });
    
    logger.log(`✅ CORS configured - Allowing: ${corsOrigin === '*' ? 'ALL ORIGINS (*)' : allowedOrigins.join(', ')}`);
    
    // ✅ CRITICAL: Add explicit CORS middleware that runs FIRST
    // This handles preflight OPTIONS requests before they hit any route handlers
    app.use((req, res, next) => {
      const origin = req.headers.origin as string | undefined;
      
      // Determine if origin should be allowed
      let shouldAllow = false;
      if (!origin) {
        shouldAllow = true; // Same-origin requests
      } else if (corsOrigin === '*') {
        shouldAllow = true; // Wildcard mode
      } else if (allowedOrigins.includes(origin)) {
        shouldAllow = true; // Explicitly allowed
      }
      
      // Set CORS headers if origin is allowed
      if (shouldAllow && origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
        res.setHeader('Access-Control-Max-Age', '86400');
      }
      
      // Handle preflight OPTIONS requests
      if (req.method === 'OPTIONS') {
        logger.log(`🔄 CORS: Handling OPTIONS preflight from ${origin || 'unknown'}`);
        return res.status(204).send();
      }
      
      next();
    });
    
    // ✅ Security headers
    app.use(helmet({
      contentSecurityPolicy: false, // CSP is managed at the frontend/nginx layer
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.use(cookieParser());

    // ✅ Global exception filter
    app.useGlobalFilters(new AllExceptionsFilter());

    // ✅ Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // ✅ Global prefix for all routes
    app.setGlobalPrefix('api/v1');

    const port = process.env.PORT || 3000;
    await app.listen(port);
    
    logger.log(`🚀 Smart Farm Backend is running on: http://localhost:${port}/api/v1`);
    logger.log(`📊 Health check: http://localhost:${port}/api/v1/health`);
    logger.log(`🔧 API Documentation: http://localhost:${port}/api/v1`);
    logger.log(`✅ Backend started successfully!`);
    
  } catch (error) {
    logger.error('❌ Failed to start Smart Farm Backend:', error);
    logger.error('Error details:', error.message);
    logger.error('Stack trace:', error.stack);
    
    // Try to provide more specific error information
    if (error.message?.includes('database')) {
      logger.error('💡 Database connection issue detected. Check DATABASE_URL environment variable.');
    }
    if (error.message?.includes('port')) {
      logger.error('💡 Port binding issue detected. Check PORT environment variable.');
    }
    
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});
