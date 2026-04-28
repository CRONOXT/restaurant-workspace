import 'dotenv/config';
import { PrismaClient, Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando la siembra de datos (Seed)...');

  // 1. Limpiar base de datos (Opcional, pero recomendado para seed limpio)
  // El orden importa por las relaciones
  await prisma.pedido.deleteMany();
  await prisma.comensal.deleteMany();
  await prisma.sesion.deleteMany();
  await prisma.mesa.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.sucursal.deleteMany();

  console.log('🧹 Base de datos limpia.');

  // 2. Crear Usuarios
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.usuario.create({
    data: {
      nombre: 'Gerente General',
      email: 'gerente@savor.com',
      password: hashedPassword,
      rol: Rol.GERENTE,
      isActive: true,
    },
  });

  await prisma.usuario.create({
    data: {
      nombre: 'Camarero Pro',
      email: 'camarero@savor.com',
      password: hashedPassword,
      rol: Rol.CAMARERO,
      isActive: true,
    },
  });

  // 3. Crear Sucursales
  const sucursalesData = [
    { nombre: 'Savor Gourmet - Las Mercedes', direccion: 'Calle Madrid, Qta. Savor', numeroMesas: 10 },
    { nombre: 'Savor Express - Sambil', direccion: 'Nivel Feria, Local E-12', numeroMesas: 15 },
    { nombre: 'Savor Garden - El Hatillo', direccion: 'Calle Bolivar, Casa Nro 4', numeroMesas: 8 },
  ];

  for (const s of sucursalesData) {
    const sucursal = await prisma.sucursal.create({ data: s });

    // Crear Mesas para cada sucursal
    for (let i = 1; i <= s.numeroMesas; i++) {
      await prisma.mesa.create({
        data: {
          numero: i,
          capacidad: i % 2 === 0 ? 4 : 2,
          sucursalId: sucursal.id,
          qrCode: `QR-${sucursal.id}-${i}`,
          isActive: true,
        },
      });
    }

    // Crear Menú para la sucursal
    const menu = await prisma.menu.create({
      data: {
        nombre: `Carta ${s.nombre.split(' - ')[0]}`,
        sucursalId: sucursal.id,
        moneda: 'USD',
        isActive: true,
      },
    });

    // Crear Categorías
    const categoriasData = [
      { nombre: 'Entradas', orden: 1 },
      { nombre: 'Platos Fuertes', orden: 2 },
      { nombre: 'Bebidas', orden: 3 },
      { nombre: 'Postres', orden: 4 },
    ];

    for (const cData of categoriasData) {
      const categoria = await prisma.categoria.create({
        data: {
          ...cData,
          menuId: menu.id,
        },
      });

      // Crear Productos por categoría
      if (cData.nombre === 'Entradas') {
        await prisma.producto.createMany({
          data: [
            { nombre: 'Tequeños Tradicionales', descripcion: '6 unidades con salsa tártara', precio: 6.5, categoriaId: categoria.id, disponible: true },
            { nombre: 'Ceviche de la Casa', descripcion: 'Pescado blanco marinado en limón', precio: 12.0, categoriaId: categoria.id, disponible: true },
          ],
        });
      } else if (cData.nombre === 'Platos Fuertes') {
        await prisma.producto.createMany({
          data: [
            { nombre: 'Hamburguesa Savor', descripcion: '200g carne, queso cheddar, tocino y cebolla caramelizada', precio: 14.0, categoriaId: categoria.id, disponible: true },
            { nombre: 'Pasta Carbonara', descripcion: 'Receta original con guanciale y pecorino', precio: 13.5, categoriaId: categoria.id, disponible: true },
            { nombre: 'Ribeye a la Parrilla', descripcion: '400g de carne premium con acompañante', precio: 22.0, categoriaId: categoria.id, disponible: true },
          ],
        });
      } else if (cData.nombre === 'Bebidas') {
        await prisma.producto.createMany({
          data: [
            { nombre: 'Limonada Frappé', descripcion: 'Refrescante con hierbabuena', precio: 3.5, categoriaId: categoria.id, disponible: true },
            { nombre: 'Cerveza Artesanal', descripcion: 'Tipo IPA local', precio: 5.0, categoriaId: categoria.id, disponible: true },
            { nombre: 'Copa de Vino Tinto', descripcion: 'Cabernet Sauvignon', precio: 7.0, categoriaId: categoria.id, disponible: true },
          ],
        });
      } else if (cData.nombre === 'Postres') {
        await prisma.producto.createMany({
          data: [
            { nombre: 'Brownie con Helado', descripcion: 'Chocolate oscuro y helado de vainilla', precio: 6.0, categoriaId: categoria.id, disponible: true },
            { nombre: 'Quesillo Casero', descripcion: 'El clásico venezolano', precio: 4.5, categoriaId: categoria.id, disponible: true },
          ],
        });
      }
    }
  }

  console.log('✅ Siembra completada con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
