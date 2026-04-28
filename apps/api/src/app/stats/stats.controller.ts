import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('Stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener estadísticas globales para el Dashboard' })
  getDashboardStats(@Query('sucursalId') sucursalId?: string) {
    return this.statsService.getDashboardStats(sucursalId);
  }
}
