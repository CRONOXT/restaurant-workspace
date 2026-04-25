import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UsuarioCreateInput): Promise<Usuario> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.usuario.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async findAll(): Promise<Omit<Usuario, 'password'>[]> {
    const usuarios = await this.prisma.usuario.findMany();
    return usuarios.map(u => {
      const { password, ...result } = u;
      return result;
    });
  }

  async findOne(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  async update(id: string, data: Prisma.UsuarioUpdateInput): Promise<Usuario> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password as string, 10);
    }
    return this.prisma.usuario.update({ where: { id }, data });
  }

  async remove(id: string): Promise<Usuario> {
    return this.prisma.usuario.delete({ where: { id } });
  }
}
