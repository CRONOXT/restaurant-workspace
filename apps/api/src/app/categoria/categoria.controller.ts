import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { Prisma, Rol } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { MenuService } from '../menu/menu.service';

@Controller('categoria')
export class CategoriaController {
  constructor(
    private readonly categoriaService: CategoriaService,
    private readonly menuService: MenuService
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() data: Prisma.CategoriaUncheckedCreateInput, @CurrentUser() user: any) {
    // Validar que el menú pertenezca a la empresa del usuario
    const menu = await this.menuService.findOne(data.menuId);
    if (!menu) throw new ForbiddenException('Menú no encontrado');
    
    if (user.rol !== Rol.ADMIN && (menu as any).sucursal.empresaId !== user.empresaId) {
      throw new ForbiddenException('No puedes añadir categorías a este menú');
    }
    return this.categoriaService.create(data);
  }

  @Get()
  async findAll(@Query('menuId') menuId: string, @CurrentUser() user?: any) {
    if (!menuId) {
      throw new Error('menuId es requerido para buscar categorías');
    }
    
    const menu = await this.menuService.findOne(menuId);
    if (!menu) throw new ForbiddenException('Menú no encontrado');

    // Solo validamos si hay un usuario logueado (Backoffice)
    if (user && user.rol !== Rol.ADMIN && (menu as any).sucursal.empresaId !== user.empresaId) {
      throw new ForbiddenException('No tienes permiso para ver estas categorías');
    }

    return this.categoriaService.findAllByMenu(menuId);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() data: Prisma.CategoriaUpdateInput, @CurrentUser() user: any) {
    return this.categoriaService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.categoriaService.remove(id);
  }
}
