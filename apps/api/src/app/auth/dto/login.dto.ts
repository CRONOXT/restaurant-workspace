import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Correo electrónico del usuario', example: 'usuario@ejemplo.com' })
  email!: string;

  @ApiProperty({ description: 'Contraseña del usuario', example: 'MiPasswordSeguro123' })
  password!: string;
}
