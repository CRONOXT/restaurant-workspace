import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SucursalService } from './sucursal.service';
import { Prisma, Rol } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Sucursal')
@Controller('sucursal')
@UseGuards(AuthGuard)
export class SucursalController {
  constructor(private readonly sucursalService: SucursalService) {}

  @Post()
  create(@Body() data: Prisma.SucursalCreateInput, @CurrentUser() user: any) {
    // Si no es SuperAdmin, forzar que la sucursal pertenezca a su empresa
    if (user.rol !== Rol.ADMIN) {
      if (!user.empresaId) throw new ForbiddenException('No tienes una empresa asociada');
      (data as any).empresa = { connect: { id: user.empresaId } };
    }
    return this.sucursalService.create(data);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any
  ) {
    // Si es SuperAdmin ve todo, si no, solo lo de su empresa
    const empresaId = user.rol === Rol.ADMIN ? undefined : user.empresaId;
    return this.sucursalService.findAll(empresaId, search, page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const sucursal = await this.sucursalService.findOne(id);
    if (!sucursal) return null;

    if (user.rol !== Rol.ADMIN && sucursal.empresaId !== user.empresaId) {
      throw new ForbiddenException('No tienes permiso para ver esta sucursal');
    }
    return sucursal;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Prisma.SucursalUpdateInput, @CurrentUser() user: any) {
    const sucursal = await this.sucursalService.findOne(id);
    if (!sucursal) return null;

    if (user.rol !== Rol.ADMIN && sucursal.empresaId !== user.empresaId) {
      throw new ForbiddenException('No puedes editar esta sucursal');
    }
    return this.sucursalService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const sucursal = await this.sucursalService.findOne(id);
    if (!sucursal) return null;

    if (user.rol !== Rol.ADMIN && sucursal.empresaId !== user.empresaId) {
      throw new ForbiddenException('No puedes eliminar esta sucursal');
    }
    return this.sucursalService.remove(id);
  }
}
