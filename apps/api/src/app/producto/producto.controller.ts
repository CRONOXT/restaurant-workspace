import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { Prisma } from '@prisma/client';

@Controller('producto')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Post()
  create(@Body() data: Prisma.ProductoUncheckedCreateInput) {
    return this.productoService.create(data);
  }

  @Get()
  findAll(
    @Query('categoriaId') categoriaId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productoService.findAll(categoriaId, search, page, limit);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Prisma.ProductoUpdateInput) {
    return this.productoService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productoService.remove(id);
  }
}
