import 'dotenv/config';
import { PrismaClient, Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando la siembra masiva de datos (Seed Multi-tenant)...');

  // 1. Limpiar base de datos
  await prisma.pedido.deleteMany();
  await prisma.comensal.deleteMany();
  await prisma.sesion.deleteMany();
  await prisma.mesa.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.sucursal.deleteMany();
  await prisma.empresa.deleteMany();

  console.log('🧹 Base de datos limpia.');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 2. Crear Súper Admin (Tú)
  await prisma.usuario.create({
    data: {
      nombre: 'Diego Cumares (Súper Admin)',
      email: 'diego@savor.com',
      password: hashedPassword,
      rol: Rol.ADMIN,
      isActive: true,
    },
  });

  // 3. Definición de Empresas y sus datos
  const empresasData = [
    {
      nombre: 'Savor Corporation',
      nit: 'J-11111111-1',
      admin: { email: 'dueno@savor.com', nombre: 'Dueño Savor' },
      sucursales: [
        { nombre: 'Savor Las Mercedes', direccion: 'Calle Madrid' },
        { nombre: 'Savor Los Palos Grandes', direccion: 'Av. Andres Bello' }
      ]
    },
    {
      nombre: 'Burger Master',
      nit: 'J-22222222-2',
      admin: { email: 'admin@burgermaster.com', nombre: 'Carlos Burger' },
      sucursales: [
        { nombre: 'Burger Master Sambil', direccion: 'Centro Comercial Sambil' },
        { nombre: 'Burger Master Chacao', direccion: 'Calle Elice' }
      ]
    },
    {
      nombre: 'Sushi Zen',
      nit: 'J-33333333-3',
      admin: { email: 'contacto@sushizen.com', nombre: 'Yuki Tanaka' },
      sucursales: [
        { nombre: 'Sushi Zen Hatillo', direccion: 'Pueblo de El Hatillo' }
      ]
    }
  ];

  for (const eData of empresasData) {
    // Crear Empresa
    const empresa = await prisma.empresa.create({
      data: { nombre: eData.nombre, nit: eData.nit }
    });

    // Crear Admin de Empresa
    await prisma.usuario.create({
      data: {
        nombre: eData.admin.nombre,
        email: eData.admin.email,
        password: hashedPassword,
        rol: Rol.ADMIN_EMPRESA,
        empresaId: empresa.id,
      }
    });

    // Crear Sucursales y sus empleados
    for (const sData of eData.sucursales) {
      const sucursal = await prisma.sucursal.create({
        data: {
          nombre: sData.nombre,
          direccion: sData.direccion,
          empresaId: empresa.id,
          numeroMesas: 5
        }
      });

      // Crear Gerente de Sucursal
      await prisma.usuario.create({
        data: {
          nombre: `Gerente ${sData.nombre}`,
          email: `gerente.${sucursal.id.substring(0,4)}@${eData.admin.email.split('@')[1]}`,
          password: hashedPassword,
          rol: Rol.GERENTE,
          empresaId: empresa.id,
          sucursalId: sucursal.id
        }
      });

      // Crear 2 Camareros
      for (let i = 1; i <= 2; i++) {
        await prisma.usuario.create({
          data: {
            nombre: `Camarero ${i} ${sData.nombre}`,
            email: `camarero${i}.${sucursal.id.substring(0,4)}@${eData.admin.email.split('@')[1]}`,
            password: hashedPassword,
            rol: Rol.CAMARERO,
            empresaId: empresa.id,
            sucursalId: sucursal.id
          }
        });
      }

      // Crear 5 Mesas
      for (let m = 1; m <= 5; m++) {
        await prisma.mesa.create({
          data: {
            numero: m,
            sucursalId: sucursal.id,
            qrCode: `QR-${sucursal.id}-${m}`
          }
        });
      }

      // Crear Menú
      const menu = await prisma.menu.create({
        data: {
          nombre: `Menú ${sData.nombre}`,
          sucursalId: sucursal.id,
          moneda: 'USD'
        }
      });

      const cat = await prisma.categoria.create({
        data: { nombre: 'Especialidades', menuId: menu.id, orden: 1 }
      });

      await prisma.producto.createMany({
        data: [
          { nombre: `Plato Estrella ${eData.nombre}`, precio: 15, categoriaId: cat.id },
          { nombre: `Bebida de la Casa`, precio: 5, categoriaId: cat.id }
        ]
      });
    }
  }

  console.log('✅ Siembra masiva completada con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
