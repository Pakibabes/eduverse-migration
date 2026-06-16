import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // 1. Loads your secret keys from your root .env file app-wide
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. Turns on your global database connection engine
    PrismaModule,
  ],
})
export class AppModule {}
