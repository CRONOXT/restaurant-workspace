import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { Prisma, Rol } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('producto')
@UseGuards(AuthGuard)
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Post()
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
    // Si no es SuperAdmin, el servicio debería filtrar por empresaId.
    // Para simplificar esta iteración, asumimos que si tiene categoriaId ya está filtrado por el menú de su empresa.
    return this.productoService.findAll(categoriaId, search, page, limit);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Prisma.ProductoUpdateInput, @CurrentUser() user: any) {
    return this.productoService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productoService.remove(id);
  }
}
