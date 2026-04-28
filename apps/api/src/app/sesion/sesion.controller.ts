import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SesionService } from './sesion.service';

@ApiTags('Sesion')
@Controller('sesion')
export class SesionController {
  constructor(private readonly sesionService: SesionService) {}

  @Post('crear')
  @ApiOperation({ summary: 'Crear sesión de mesa (el primer comensal se convierte en líder)' })
  crear(@Body() body: { mesaId: string; nombreLider: string }) {
    return this.sesionService.crear(body.mesaId, body.nombreLider);
  }

  @Post('unirse')
  @ApiOperation({ summary: 'Unirse a una sesión existente por código de invitación' })
  unirse(@Body() body: { codigo: string; nombre: string }) {
    return this.sesionService.unirse(body.codigo, body.nombre);
  }

  @Get('mesa/:mesaId/activa')
  @ApiOperation({ summary: 'Obtener la sesión activa de una mesa' })
  findActivaByMesa(@Param('mesaId') mesaId: string) {
    return this.sesionService.findActivaByMesa(mesaId);
  }

  @Get('comensal/token/:token')
  @ApiOperation({ summary: 'Identificar un comensal por su token (reconexión)' })
  getComensalByToken(@Param('token') token: string) {
    return this.sesionService.getComensalByToken(token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener sesión por ID con comensales y pedidos' })
  findById(@Param('id') id: string) {
    return this.sesionService.findById(id);
  }

  @Get(':id/cuentas')
  @ApiOperation({ summary: 'Obtener desglose de cuentas individuales y compartidas' })
  getCuentas(@Param('id') id: string) {
    return this.sesionService.getCuentas(id);
  }

  @Put(':id/cerrar')
  @ApiOperation({ summary: 'Cerrar sesión (al liberar mesa)' })
  cerrar(@Param('id') id: string) {
    return this.sesionService.cerrar(id);
  }

  @Post(':id/solicitar-cierre')
  @ApiOperation({ summary: 'Líder solicita cierre de mesa (requiere aprobación del camarero)' })
  solicitarCierre(@Param('id') id: string) {
    return this.sesionService.solicitarCierre(id);
  }

  @Put(':id/rechazar-cierre')
  @ApiOperation({ summary: 'Camarero rechaza solicitud de cierre' })
  rechazarCierre(@Param('id') id: string) {
    return this.sesionService.rechazarCierre(id);
  }
}
