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
      cors: true, // Enable CORS at app creation for better compatibility
    });
    
    // ✅ Configure CORS FIRST (before other middleware)
    // CORS configuration: supports Railway domains, localhost, and custom origins
    const corsOrigin = process.env.CORS_ORIGIN;
    const railwayPattern = /^https:\/\/.*\.up\.railway\.app$/;
    const localhostPattern = /^http:\/\/localhost(:\d+)?$/;
    const localhostIpPattern = /^http:\/\/127\.0\.0\.1(:\d+)?$/;
    
    // Function to validate origin - compatible with Express CORS middleware
    const validateOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      try {
        // Allow requests with no origin (same-origin, mobile apps, Postman, etc.)
        if (!origin) {
          callback(null, true);
          return;
        }
        
        // Allow all if CORS_ORIGIN is '*'
        if (corsOrigin === '*') {
          callback(null, true);
          return;
        }
        
        // Allow all Railway domains
        if (railwayPattern.test(origin)) {
          logger.log(`✅ CORS: Allowed Railway origin: ${origin}`);
          callback(null, true);
          return;
        }
        
        // Allow localhost for development
        if (localhostPattern.test(origin) || localhostIpPattern.test(origin)) {
          logger.log(`✅ CORS: Allowed localhost origin: ${origin}`);
          callback(null, true);
          return;
        }
        
        // Check custom origins from environment variable
        if (corsOrigin) {
          const customOrigins = corsOrigin.split(',').map(o => o.trim()).filter(o => o);
          if (customOrigins.includes(origin)) {
            logger.log(`✅ CORS: Allowed custom origin: ${origin}`);
            callback(null, true);
            return;
          }
        }
        
        // Reject all other origins
        logger.warn(`❌ CORS: Blocked origin: ${origin}`);
        callback(null, false);
      } catch (error) {
        logger.error(`❌ CORS validation error: ${error.message}`);
        callback(error, false);
      }
    };
    
    app.enableCors({
      origin: corsOrigin === '*' ? true : validateOrigin,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cookie'],
      exposedHeaders: ['Authorization', 'Set-Cookie'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
      maxAge: 86400, // 24 hours
    });
    
    logger.log(`✅ CORS configured - Railway domains (*.up.railway.app) and localhost allowed`);
    
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
