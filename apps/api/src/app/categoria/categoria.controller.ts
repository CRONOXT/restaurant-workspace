import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { Prisma } from '@prisma/client';

@Controller('categoria')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Post()
  create(@Body() data: Prisma.CategoriaUncheckedCreateInput) {
    return this.categoriaService.create(data);
  }

  @Get()
  findAll(@Query('menuId') menuId: string) {
    if (!menuId) {
      throw new Error('menuId es requerido para buscar categorías');
    }
    return this.categoriaService.findAllByMenu(menuId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Prisma.CategoriaUpdateInput) {
    return this.categoriaService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriaService.remove(id);
  }
}
