import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SucursalService } from './sucursal.service';
import { Prisma } from '@prisma/client';

@ApiTags('Sucursal')
@Controller('sucursal')
export class SucursalController {
  constructor(private readonly sucursalService: SucursalService) {}

  @Post()
  create(@Body() createSucursalDto: Prisma.SucursalCreateInput) {
    return this.sucursalService.create(createSucursalDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.sucursalService.findAll(search, page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sucursalService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateSucursalDto: Prisma.SucursalUpdateInput) {
    return this.sucursalService.update(id, updateSucursalDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sucursalService.remove(id);
  }
}
