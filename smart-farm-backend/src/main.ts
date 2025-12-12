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
    
    // ✅ CORS Configuration - CRITICAL: Must be configured BEFORE all other middleware
    const corsOrigin = process.env.CORS_ORIGIN || '*';
    const frontendOrigin = 'https://feedin.up.railway.app';
    const allowedOrigins = [
      frontendOrigin,
      'http://localhost:4200',
      'http://127.0.0.1:4200'
    ];
    
    // Build final allowed origins list
    if (corsOrigin !== '*') {
      corsOrigin.split(',').forEach(o => {
        const trimmed = o.trim();
        if (trimmed && !allowedOrigins.includes(trimmed)) {
          allowedOrigins.push(trimmed);
        }
      });
    }
    
    // Configure CORS - use function to handle wildcard properly with credentials
    app.enableCors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin
        if (!origin) {
          callback(null, true);
          return;
        }
        
        // If wildcard mode, allow all origins (cors middleware will set exact origin)
        if (corsOrigin === '*') {
          callback(null, true);
          return;
        }
        
        // Check allowed origins
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        
        callback(null, false);
      },
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'Origin'],
      exposedHeaders: ['Authorization', 'Set-Cookie'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
    
    logger.log(`✅ CORS configured - Mode: ${corsOrigin === '*' ? 'ALLOW ALL' : 'EXPLICIT'}`);
    if (corsOrigin !== '*') {
      logger.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
    }
    
    // ✅ Add explicit CORS headers middleware - runs BEFORE helmet and other middleware
    // This ensures CORS headers are ALWAYS set, especially for OPTIONS requests
    app.use((req, res, next) => {
      const origin = req.headers.origin;
      
      // Determine if origin should be allowed
      const shouldAllow = !origin || 
        corsOrigin === '*' || 
        allowedOrigins.includes(origin as string);
      
      if (shouldAllow && origin) {
        // Set exact origin (required when credentials: true - cannot use '*')
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
        res.setHeader('Access-Control-Max-Age', '86400');
      }
      
      // Handle preflight OPTIONS requests immediately
      if (req.method === 'OPTIONS') {
        logger.log(`🔄 CORS: OPTIONS preflight from ${origin || 'no-origin'}`);
        return res.status(204).end();
      }
      
      next();
    });
    
    // ✅ Security headers (after CORS)
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
