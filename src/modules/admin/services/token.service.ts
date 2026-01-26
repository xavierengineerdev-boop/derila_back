import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken, RefreshTokenDocument } from '../schemas/refresh-token.schema';
import { AdminDocument } from '../schemas/admin.schema';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  generateAccessToken(payload: TokenPayload): string {
    const secret = this.configService.get<string>('jwt.accessSecret');
    const expiresIn = (this.configService.get<string>('jwt.accessExpiresIn') || '15m') as any;
    
    return this.jwtService.sign(payload as any, {
      secret,
      expiresIn,
    });
  }

  async generateRefreshToken(adminId: string): Promise<string> {
    const expiresInDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const secret = this.configService.get<string>('jwt.refreshSecret');
    const expiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    const token = this.jwtService.sign(
      { sub: adminId } as any,
      {
        secret,
        expiresIn: expiresIn as any,
      },
    );

    await this.refreshTokenModel.create({
      adminId,
      token,
      expiresAt,
      isActive: true,
    });

    return token;
  }

  async validateRefreshToken(token: string): Promise<string | null> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const refreshToken = await this.refreshTokenModel.findOne({
        token,
        isActive: true,
      });

      if (!refreshToken || refreshToken.expiresAt < new Date()) {
        return null;
      }

      return payload.sub;
    } catch (error) {
      return null;
    }
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenModel.updateOne(
      { token },
      { isActive: false },
    );
  }

  async revokeAllAdminTokens(adminId: string): Promise<void> {
    await this.refreshTokenModel.updateMany(
      { adminId, isActive: true },
      { isActive: false },
    );
  }

  async generateTokenPair(admin: AdminDocument): Promise<TokenResponse> {
    const adminId = (admin as any)._id.toString();
    const payload: TokenPayload = {
      sub: adminId,
      email: admin.email,
      role: admin.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(adminId);

    return {
      accessToken,
      refreshToken,
    };
  }
}

