import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MesaService } from './mesa.service';
import { Prisma } from '@prisma/client';

@ApiTags('Mesa')
@Controller('mesa')
export class MesaController {
  constructor(private readonly mesaService: MesaService) {}

  @Post()
  create(@Body() createMesaDto: Prisma.MesaCreateInput) {
    return this.mesaService.create(createMesaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las mesas con búsqueda y paginación' })
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sucursalId') sucursalId?: string,
  ) {
    return this.mesaService.findAll(search, page, limit, sucursalId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mesaService.findOne(id);
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
  update(@Param('id') id: string, @Body() updateMesaDto: Prisma.MesaUpdateInput) {
    return this.mesaService.update(id, updateMesaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mesaService.remove(id);
  }
}

