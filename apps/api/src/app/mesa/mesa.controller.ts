import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MesaService } from './mesa.service';
import { Prisma, Rol } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Mesa')
@Controller('mesa')
export class MesaController {
  constructor(private readonly mesaService: MesaService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createMesaDto: Prisma.MesaCreateInput) {
    return this.mesaService.create(createMesaDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener todas las mesas con búsqueda y paginación' })
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sucursalId') sucursalId?: string,
    @CurrentUser() user?: any,
  ) {
    const empresaId = user?.rol === Rol.ADMIN ? undefined : user?.empresaId;
    return this.mesaService.findAll(search, page, limit, sucursalId, empresaId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    const mesa = await this.mesaService.findOne(id);
    if (!mesa) return null;

    // Si hay usuario logueado, validar empresa
    if (user && user.rol !== Rol.ADMIN && (mesa as any).sucursal.empresaId !== user.empresaId) {
      throw new ForbiddenException('No tienes permiso para ver esta mesa');
    }
    return mesa;
  }

  @Put(':id/occupy')
  @ApiOperation({ summary: 'Ocupar mesa y enviar alerta' })
  occupy(@Param('id') id: string) {
    return this.mesaService.occupy(id);
  }

  @Put(':id/free')
  @ApiOperation({ summary: 'Liberar mesa y enviar alerta' })
  free(@Param('id') id: string) {
    return this.mesaService.free(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() updateMesaDto: Prisma.MesaUpdateInput, @CurrentUser() user: any) {
    const mesa = await this.mesaService.findOne(id);
    if (!mesa) return null;

    if (user.rol !== Rol.ADMIN && (mesa as any).sucursal.empresaId !== user.empresaId) {
      throw new ForbiddenException('No puedes editar esta mesa');
    }
    return this.mesaService.update(id, updateMesaDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const mesa = await this.mesaService.findOne(id);
    if (!mesa) return null;

    if (user.rol !== Rol.ADMIN && (mesa as any).sucursal.empresaId !== user.empresaId) {
      throw new ForbiddenException('No puedes eliminar esta mesa');
    }
    return this.mesaService.remove(id);
  }
}
