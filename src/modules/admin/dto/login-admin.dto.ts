import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class LoginAdminDto {
  @ApiProperty({
    description: 'Email админа',
    example: 'ihorhnennyi@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Пароль админа',
    example: '123456789',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}


