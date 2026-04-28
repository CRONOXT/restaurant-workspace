import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Rol } from '@prisma/client';

@ApiTags('Stats')
@Controller('stats')
@UseGuards(AuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener estadísticas para el Dashboard' })
  getDashboardStats(@CurrentUser() user: any, @Query('sucursalId') sucursalId?: string) {
    // Si es SuperAdmin y no manda sucursalId, devolvemos global (null, null)
    // Si es AdminEmpresa, filtramos por su empresaId
    // Si es Gerente/Camarero, usamos su sucursalId (si no manda una)
    
    let finalEmpresaId = user.rol === Rol.ADMIN ? undefined : user.empresaId;
    let finalSucursalId = sucursalId || user.sucursalId;

    // Si es SuperAdmin y mandó sucursalId, respetamos eso
    if (user.rol === Rol.ADMIN && sucursalId) {
      finalEmpresaId = undefined;
    }

    return this.statsService.getDashboardStats(finalEmpresaId, finalSucursalId);
  }
}
