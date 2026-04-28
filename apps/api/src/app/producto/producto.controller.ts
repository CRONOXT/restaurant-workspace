import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { Prisma, Rol } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('producto')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() data: Prisma.ProductoUncheckedCreateInput, @CurrentUser() user: any) {
    return this.productoService.create(data);
  }

  @Get()
  findAll(
    @Query('categoriaId') categoriaId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any
  ) {
    return this.productoService.findAll(categoriaId, search, page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productoService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() data: Prisma.ProductoUpdateInput, @CurrentUser() user: any) {
    return this.productoService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productoService.remove(id);
  }
}
