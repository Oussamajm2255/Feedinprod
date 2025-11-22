import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const typeOrmConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  // Check if DATABASE_URL is provided (Railway deployment)
  const databaseUrl = configService.get('DATABASE_URL');
  
  if (databaseUrl) {
    // Use DATABASE_URL for Railway PostgreSQL deployment
    return {
      type: 'postgres',
      url: databaseUrl,
      autoLoadEntities: true,
      // Default to false in production to avoid ALTERs on existing data
      synchronize: configService.get('DB_SYNCHRONIZE', 'false') === 'true',
      cache: false,
      // Default to false; enable only when running fresh
      migrationsRun: configService.get('DB_MIGRATIONS_RUN', 'false') === 'true',
      dropSchema: false,
      logging: configService.get('LOG_LEVEL', 'error') === 'debug',
      ssl: {
        rejectUnauthorized: false,
      },
      // Add retry configuration for Railway
      retryAttempts: 5,
      retryDelay: 5000,
      maxQueryExecutionTime: 30000,
      // Don't fail startup if database is not available (handled via extra options)
      // Additional PostgreSQL-specific options
      extra: {
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        max: 20,
      },
      // Enable migrations for PostgreSQL
      migrations: ['dist/migrations/*.js'],
      migrationsTableName: 'migrations',
    };
  }
  
  // Fallback to individual PostgreSQL configuration (Neon or local PostgreSQL)
  // This supports both DATABASE_URL and individual env vars (DB_HOST, DB_USER, etc.)
  const dbHost = configService.get('DB_HOST');
  const dbUser = configService.get('DB_USER');
  const dbPass = configService.get('DB_PASS');
  const dbName = configService.get('DB_NAME');
  const dbPort = +configService.get<number>('DB_PORT', 5432);

  // If individual env vars are provided, use them for PostgreSQL
  if (dbHost && dbUser && dbPass && dbName) {
    return {
      type: 'postgres',
      host: dbHost,
      port: dbPort,
      username: dbUser,
      password: dbPass,
      database: dbName,
      autoLoadEntities: true,
      synchronize: configService.get('DB_SYNCHRONIZE', 'false') === 'true',
      cache: false,
      migrationsRun: configService.get('DB_MIGRATIONS_RUN', 'false') === 'true',
      dropSchema: false,
      logging: configService.get('LOG_LEVEL', 'error') === 'debug',
      ssl: {
        rejectUnauthorized: false,
      },
      // Add retry configuration for PostgreSQL
      retryAttempts: 5,
      retryDelay: 5000,
      maxQueryExecutionTime: 30000,
      // Additional PostgreSQL-specific options
      extra: {
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        max: 20,
      },
      // Enable migrations for PostgreSQL
      migrations: ['dist/migrations/*.js'],
      migrationsTableName: 'migrations',
    };
  }

  // If neither DATABASE_URL nor individual vars are set, throw an error
  throw new Error(
    'Database configuration missing! Please set either DATABASE_URL or DB_HOST, DB_USER, DB_PASS, DB_NAME environment variables.'
  );
};
