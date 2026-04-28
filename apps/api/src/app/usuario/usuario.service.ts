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

  async findAll(search?: string, page = 1, limit = 10): Promise<{ data: Omit<Usuario, 'password'>[], total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.UsuarioWhereInput = search ? {
      OR: [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    } : {};

    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.usuario.count({ where })
    ]);

    const data = usuarios.map(u => {
      const { password, ...result } = u;
      return result;
    });

    return { data, total };
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
