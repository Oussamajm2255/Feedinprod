import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModuleNoDb } from './app.module.no-db';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('🚀 Starting Smart Farm Backend (No Database Version)...');
    
    const app = await NestFactory.create(AppModuleNoDb, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    
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

    // ✅ CORS Configuration
    // Note: When credentials: true, we cannot use '*' - must specify exact origins
    const corsOrigin = process.env.CORS_ORIGIN?.trim();
    let allowedOrigins: string[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);
    
    // Default origins that should always be included
    const defaultOrigins = [
      'http://127.0.0.1:4200',
      'http://localhost:4200',
      'https://feedin.up.railway.app',
    ];
    
    if (corsOrigin) {
      if (corsOrigin === '*') {
        // When credentials are true, we need to allow all origins dynamically
        // Use a function that accepts any origin
        allowedOrigins = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          // Allow any origin when CORS_ORIGIN is set to *
          callback(null, true);
        };
        logger.log('🌐 CORS: Allowing all origins (*) with credentials support');
      } else {
        // Split by comma and trim each origin, merge with defaults
        const envOrigins = corsOrigin.split(',').map(origin => origin.trim()).filter(Boolean);
        allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])]; // Remove duplicates
        logger.log(`🌐 CORS: Allowing origins: ${allowedOrigins.join(', ')}`);
      }
    } else {
      // Default fallback origins - include the frontend domain
      allowedOrigins = defaultOrigins;
      logger.log(`🌐 CORS: Using default origins: ${allowedOrigins.join(', ')}`);
    }

    app.enableCors({
      origin: allowedOrigins,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Accept', 'Origin', 'X-Requested-With'],
      exposedHeaders: ['Set-Cookie'],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
      maxAge: 86400, // 24 hours
    });
    
    logger.log(`✅ CORS configured successfully`);
    logger.log(`📋 CORS_ORIGIN env: ${corsOrigin || 'not set'}`);

    const port = process.env.PORT || 3000;
    await app.listen(port);
    
    logger.log(`🚀 Smart Farm Backend (No DB) is running on: http://localhost:${port}/api/v1`);
    logger.log(`📊 Health check: http://localhost:${port}/api/v1/health`);
    logger.log(`🔧 API Documentation: http://localhost:${port}/api/v1`);
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`🗄️ Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
    logger.log(`🔌 MQTT Broker: ${process.env.MQTT_BROKER || 'Not set'}`);
    
  } catch (error) {
    logger.error('❌ Failed to start Smart Farm Backend:', error);
    logger.error('Error details:', error.message);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});
