import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PedidoService } from './pedido.service';
import { EstadoPedido } from '@prisma/client';

@ApiTags('Pedido')
@Controller('pedido')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo pedido desde una mesa' })
  create(@Body() body: {
    mesaId: string;
    items: any[];
    notas?: string;
    sesionId?: string;
    comensalId?: string;
    esCompartido?: boolean;
  }) {
    return this.pedidoService.create(
      body.mesaId,
      body.items,
      body.notas,
      body.sesionId,
      body.comensalId,
      body.esCompartido || false
    );
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los pedidos, opcional por sucursalId y/o estado' })
  findAll(
    @Query('sucursalId') sucursalId?: string,
    @Query('estado') estado?: EstadoPedido
  ) {
    return this.pedidoService.findAll(sucursalId, estado);
  }

  @Get('mesa/:mesaId')
  @ApiOperation({ summary: 'Obtener pedidos de una mesa específica' })
  findByMesa(
    @Param('mesaId') mesaId: string,
    @Query('estado') estado?: EstadoPedido
  ) {
    return this.pedidoService.findByMesa(mesaId, estado);
  }

  @Get('sesion/:sesionId')
  @ApiOperation({ summary: 'Obtener pedidos de una sesión' })
  findBySesion(
    @Param('sesionId') sesionId: string,
    @Query('comensalId') comensalId?: string
  ) {
    return this.pedidoService.findBySesion(sesionId, comensalId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pedido por ID' })
  findOne(@Param('id') id: string) {
    return this.pedidoService.findOne(id);
  }

  @Put(':id/estado')
  @ApiOperation({ summary: 'Actualizar el estado de un pedido (PENDIENTE → ACEPTADO → ENTREGADO)' })
  updateEstado(@Param('id') id: string, @Body('estado') estado: EstadoPedido) {
    return this.pedidoService.updateEstado(id, estado);
  }
}
