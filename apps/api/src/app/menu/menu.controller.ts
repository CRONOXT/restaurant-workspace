import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { Prisma, Rol } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Menu')
@Controller('menu')
@UseGuards(AuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
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
    const empresaId = user.rol === Rol.ADMIN ? undefined : user.empresaId;
    return this.menuService.findAll(empresaId, search, page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const menu = await this.menuService.findOne(id);
    if (!menu) return null;

    if (user.rol !== Rol.ADMIN && (menu as any).sucursal.empresaId !== user.empresaId) {
      throw new ForbiddenException('No tienes permiso para ver este menú');
    }
    return menu;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Prisma.MenuUpdateInput, @CurrentUser() user: any) {
    const menu = await this.menuService.findOne(id);
    if (!menu) return null;

    if (user.rol !== Rol.ADMIN && (menu as any).sucursal.empresaId !== user.empresaId) {
      throw new ForbiddenException('No puedes editar este menú');
    }
    return this.menuService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const menu = await this.menuService.findOne(id);
    if (!menu) return null;

    if (user.rol !== Rol.ADMIN && (menu as any).sucursal.empresaId !== user.empresaId) {
      throw new ForbiddenException('No puedes eliminar este menú');
    }
    return this.menuService.remove(id);
  }
}
