import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from './schemas/admin.schema';
import {
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '../../common/exceptions';
import * as bcrypt from 'bcrypt';
import { TokenService } from './services/token.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private tokenService: TokenService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initializeAdmin();
  }

  private async initializeAdmin() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    const existingAdmin = await this.adminModel
      .findOne({ email: adminEmail })
      .exec();

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await this.adminModel.create({
        email: adminEmail,
        password: hashedPassword,
        isActive: true,
        role: 'admin',
      });
      console.log('✅ Админ успешно создан:', adminEmail);
    } else {
      const isPasswordValid = await bcrypt.compare(
        adminPassword,
        existingAdmin.password,
      );
      if (!isPasswordValid) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        existingAdmin.password = hashedPassword;
        await existingAdmin.save();
        console.log('✅ Пароль админа обновлен');
      }
    }
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return this.adminModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<Admin> {
    const admin = await this.adminModel.findById(id).exec();
    if (!admin) {
      throw new NotFoundException('Admin', { id });
    }
    return admin;
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async getAdminInfo(email: string) {
    const admin = await this.findByEmail(email);
    if (!admin) {
      throw new NotFoundException('Admin');
    }

    const adminDoc = admin as AdminDocument;
    return {
      id: adminDoc._id ? adminDoc._id.toString() : null,
      email: admin.email,
      isActive: admin.isActive,
      role: admin.role,
      createdAt: (adminDoc as any).createdAt,
      updatedAt: (adminDoc as any).updatedAt,
    };
  }

  async login(email: string, password: string) {
    const admin = await this.findByEmail(email);

    if (!admin) {
      throw new NotFoundException('Admin');
    }

    if (!admin.isActive) {
      throw new ForbiddenException('Аккаунт админа деактивирован');
    }

    const isPasswordValid = await this.validatePassword(
      password,
      admin.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return this.tokenService.generateTokenPair(admin as AdminDocument);
  }

  async refreshTokens(refreshToken: string) {
    const adminId = await this.tokenService.validateRefreshToken(refreshToken);

    if (!adminId) {
      throw new UnauthorizedException('Неверный или истекший refresh токен');
    }

    const admin = await this.findById(adminId);

    if (!admin.isActive) {
      throw new ForbiddenException('Аккаунт админа деактивирован');
    }

    await this.tokenService.revokeRefreshToken(refreshToken);

    return this.tokenService.generateTokenPair(admin as AdminDocument);
  }

  async logout(adminId: string) {
    await this.tokenService.revokeAllAdminTokens(adminId);
    return { message: 'Успешный выход' };
  }
}

