import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsuarioService } from '../usuario/usuario.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma, Rol } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usuarioService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, rol: user.rol, sucursalId: user.sucursalId };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol
      }
    };
  }

  async register(data: RegisterDto) {
    const existingUser = await this.usuarioService.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }
    // Forzamos el rol a ADMIN ya que este endpoint es exclusivamente para crear administradores.
    // La sucursal no aplica para admins, solo para camareros, por lo que no se incluye.
    const createData: Prisma.UsuarioCreateInput = {
      ...data,
      rol: Rol.ADMIN,
    };
    
    // usuarioService.create ya utiliza bcrypt internamente para hashear la contraseña de forma segura
    const user = await this.usuarioService.create(createData);
    return this.login(user);
  }
}
