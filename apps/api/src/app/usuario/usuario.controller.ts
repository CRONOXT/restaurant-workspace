import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsuarioService } from './usuario.service';
import { Prisma } from '@prisma/client';

@ApiTags('Usuario')
@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  create(@Body() createUsuarioDto: Prisma.UsuarioCreateInput) {
    return this.usuarioService.create(createUsuarioDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usuarioService.findAll(search, page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const usuario = await this.usuarioService.findOne(id);
    if (usuario) {
      const { password, ...result } = usuario;
      return result;
    }
    return null;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUsuarioDto: Prisma.UsuarioUpdateInput) {
    return this.usuarioService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usuarioService.remove(id);
  }
}
