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
  @ApiOperation({ summary: 'Obtener todas las mesas, opcional por sucursalId' })
  findAll(@Query('sucursalId') sucursalId?: string) {
    return this.mesaService.findAll(sucursalId);
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

  @Post(':id/order')
  @ApiOperation({ summary: 'Enviar pedido desde una mesa (cliente)' })
  sendOrder(@Param('id') id: string, @Body('items') items: any[]) {
    return this.mesaService.sendOrder(id, items);
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
