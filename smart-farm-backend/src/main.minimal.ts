import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModuleMinimal } from './app.module.minimal';
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
    logger.log('🚀 Starting Smart Farm Backend (Minimal Version)...');
    
    // Add a small delay to allow database to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const app = await NestFactory.create(AppModuleMinimal, {
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

    // ✅ Allow requests from your frontend
    // CORS configuration: supports Railway domains, localhost, and custom origins
    const corsOrigin = process.env.CORS_ORIGIN;
    let allowedOrigins: any;
    
    if (corsOrigin === '*') {
      allowedOrigins = true; // Allow all origins
    } else if (corsOrigin) {
      // Split comma-separated origins and include Railway domains
      const customOrigins = corsOrigin.split(',').map(o => o.trim());
      const railwayPattern = /^https:\/\/.*\.up\.railway\.app$/;
      allowedOrigins = (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow if origin matches custom list or Railway domain pattern
        if (!origin || customOrigins.includes(origin) || railwayPattern.test(origin) || 
            /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      };
    } else {
      // Default: allow localhost and Railway domains
      allowedOrigins = (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || 
            /^http:\/\/localhost:\d+$/.test(origin) || 
            /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
            /^https:\/\/.*\.up\.railway\.app$/.test(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      };
    }
    
    app.enableCors({
      origin: allowedOrigins,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      exposedHeaders: ['Authorization'],
    });

    const port = process.env.PORT || 3000;
    await app.listen(port);
    
    logger.log(`🚀 Smart Farm Backend (Minimal) is running on: http://localhost:${port}/api/v1`);
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
