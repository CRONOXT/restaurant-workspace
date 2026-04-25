import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Correo electrónico del usuario', example: 'usuario@ejemplo.com' })
  email!: string;

  @ApiProperty({ description: 'Contraseña del usuario (se encriptará de forma segura con bcrypt)', example: 'MiPasswordSeguro123' })
  password!: string;

  @ApiProperty({ description: 'Nombre completo del usuario', example: 'Juan Pérez' })
  nombre!: string;
}
