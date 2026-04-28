import { Module } from '@nestjs/common';
import { SesionService } from './sesion.service';
import { SesionController } from './sesion.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [SesionController],
  providers: [SesionService],
  exports: [SesionService]
})
export class SesionModule {}
