import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SpotsModule } from './spots/spots.module';

@Module({
  imports: [PrismaModule, AuthModule, SpotsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
