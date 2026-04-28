import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SucursalModule } from './sucursal/sucursal.module';
import { MesaModule } from './mesa/mesa.module';
import { UsuarioModule } from './usuario/usuario.module';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { CategoriaModule } from './categoria/categoria.module';
import { ProductoModule } from './producto/producto.module';
import { EventsModule } from './events/events.module';
import { PedidoModule } from './pedido/pedido.module';
import { SesionModule } from './sesion/sesion.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    PrismaModule, 
    SucursalModule, 
    MesaModule, 
    UsuarioModule, 
    AuthModule, 
    MenuModule,
    CategoriaModule,
    ProductoModule,
    EventsModule,
    PedidoModule,
    SesionModule,
    StatsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

