import { Module } from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { CategoriaController } from './categoria.controller';
import { MenuModule } from '../menu/menu.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [MenuModule],
  controllers: [CategoriaController],
  providers: [CategoriaService, PrismaService]
})
export class CategoriaModule {}
