import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      const { UnauthorizedException } = require('@nestjs/common');
      let message = 'Unauthorized';
      
      if (info) {
        if (info.message === 'No auth token') {
          message = 'No auth token';
        } else if (info.message === 'jwt expired') {
          message = 'Token expired';
        } else if (info.message === 'invalid signature') {
          message = 'Invalid token signature';
        } else {
          message = info.message || 'Unauthorized';
        }
      }
      
      throw err || new UnauthorizedException(message);
    }
    return user;
  }
}

