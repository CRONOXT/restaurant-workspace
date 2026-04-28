import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { Prisma, Rol } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() data: Prisma.MenuCreateInput) {
    return this.menuService.create(data);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any
  ) {
    // Si no hay usuario (Menú Público), devolvemos todos los menús activos filtrados por búsqueda
    const empresaId = user ? (user.rol === Rol.ADMIN ? undefined : user.empresaId) : undefined;
    return this.menuService.findAll(empresaId, search, page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    const menu = await this.menuService.findOne(id);
    if (!menu) return null;

    // Si hay un usuario logueado (Backoffice), validamos pertenencia
    if (user && user.rol !== Rol.ADMIN && (menu as any).sucursal.empresaId !== user.empresaId) {
      throw new ForbiddenException('No tienes permiso para ver este menú');
    }
    
    // Si no hay usuario (Menú Público), simplemente lo devolvemos
    return menu;
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() data: Prisma.MenuUpdateInput, @CurrentUser() user: any) {
    const menu = await this.menuService.findOne(id);
    if (!menu) return null;

    if (user.rol !== Rol.ADMIN && (menu as any).sucursal.empresaId !== user.empresaId) {
      throw new ForbiddenException('No puedes editar este menú');
    }
    return this.menuService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const menu = await this.menuService.findOne(id);
    if (!menu) return null;

    if (user.rol !== Rol.ADMIN && (menu as any).sucursal.empresaId !== user.empresaId) {
      throw new ForbiddenException('No puedes eliminar este menú');
    }
    return this.menuService.remove(id);
  }
}
