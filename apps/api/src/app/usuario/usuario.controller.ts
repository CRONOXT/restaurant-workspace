import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsuarioService } from './usuario.service';
import { Prisma, Rol } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Usuario')
@Controller('usuario')
@UseGuards(AuthGuard)
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  create(@Body() data: Prisma.UsuarioCreateInput, @CurrentUser() user: any) {
    // Si no es SuperAdmin, forzar que el nuevo usuario pertenezca a su misma empresa
    if (user.rol !== Rol.ADMIN) {
      if (!user.empresaId) throw new ForbiddenException('No tienes una empresa asociada');
      (data as any).empresa = { connect: { id: user.empresaId } };
    }
    return this.usuarioService.create(data);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any
  ) {
    // Filtramos por empresaId si no es SuperAdmin
    const empresaId = user.rol === Rol.ADMIN ? undefined : user.empresaId;
    return this.usuarioService.findAll(empresaId, search, page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const usuario = await this.usuarioService.findOne(id);
    if (!usuario) return null;

    // Protección: Un Admin de Empresa no puede ver usuarios de otras empresas
    if (user.rol !== Rol.ADMIN && usuario.empresaId !== user.empresaId) {
      throw new ForbiddenException('No tienes permiso para ver este usuario');
    }

    const { password, ...result } = usuario;
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Prisma.UsuarioUpdateInput, @CurrentUser() user: any) {
    const targetUser = await this.usuarioService.findOne(id);
    if (!targetUser) return null;

    // Validación de roles: Un gerente no puede editar usuarios
    if (user.rol === Rol.GERENTE) {
      throw new ForbiddenException('Los gerentes no pueden editar usuarios');
    }

    if (user.rol !== Rol.ADMIN && targetUser.empresaId !== user.empresaId) {
      throw new ForbiddenException('No puedes editar usuarios de otra empresa');
    }

    return this.usuarioService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const targetUser = await this.usuarioService.findOne(id);
    if (!targetUser) return null;

    if (user.rol === Rol.GERENTE) {
      throw new ForbiddenException('Los gerentes no pueden eliminar usuarios');
    }

    if (user.rol !== Rol.ADMIN && targetUser.empresaId !== user.empresaId) {
      throw new ForbiddenException('No puedes eliminar usuarios de otra empresa');
    }

    return this.usuarioService.remove(id);
  }
}
