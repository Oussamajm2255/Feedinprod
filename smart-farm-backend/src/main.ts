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
    
    // ✅ Configure CORS FIRST (before other middleware)
    // IMPORTANT: When credentials: true, we CANNOT use wildcard (*) - must specify exact origins
    const corsOrigin = process.env.CORS_ORIGIN;
    
    // Build allowed origins list - always include frontend domain explicitly
    const allowedOriginsList = [
      'https://feedin.up.railway.app',
      'http://localhost:4200',
      ...(corsOrigin && corsOrigin !== '*' 
        ? corsOrigin.split(',').map(o => o.trim()).filter(o => o)
        : [])
    ];
    
    // For credentials: true, we must use a function to return exact origin, not wildcard
    const corsOptions = {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (same-origin, mobile apps, Postman, etc.)
        if (!origin) {
          callback(null, true);
          return;
        }
        
        // If CORS_ORIGIN is '*', allow any origin but return the exact origin (required for credentials)
        if (corsOrigin === '*') {
          logger.log(`✅ CORS: Allowing origin (wildcard mode): ${origin}`);
          callback(null, true);
          return;
        }
        
        // Check if origin is in allowed list
        if (allowedOriginsList.includes(origin)) {
          logger.log(`✅ CORS: Allowed origin: ${origin}`);
          callback(null, true);
          return;
        }
        
        // Reject
        logger.warn(`❌ CORS: Blocked origin: ${origin}`);
        callback(null, false);
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: 'Content-Type, Accept, Authorization, X-CSRF-Token, X-Requested-With, Origin',
    };
    
    app.enableCors(corsOptions);
    
    logger.log(`✅ CORS configured - Allowing origins: ${corsOrigin === '*' ? 'ALL (*)' : allowedOriginsList.join(', ')}`);
    
    // ✅ Add explicit CORS headers middleware BEFORE all other middleware
    // This ensures CORS headers are set for ALL requests, especially OPTIONS preflight
    app.use((req, res, next) => {
      const origin = req.headers.origin as string | undefined;
      
      // Determine if this origin should be allowed
      const isAllowed = !origin || 
        corsOrigin === '*' ||
        allowedOriginsList.includes(origin);
      
      if (isAllowed && origin) {
        // Set exact origin (required when credentials: true)
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      } else if (!origin) {
        // Same-origin request, no CORS needed but set headers anyway
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      
      // Handle preflight OPTIONS requests
      if (req.method === 'OPTIONS') {
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
