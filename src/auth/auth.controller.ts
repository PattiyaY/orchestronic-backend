import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { BackendJwtPayload, RequestWithCookies } from 'src/lib/types';
import * as jwt from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
  constructor(private jwt: JwtService) {}

  @Get('test-login')
  testLogin(@Res() res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    const accessToken = this.jwt.sign(
      { sub: '123', role: 'Admin' },
      { expiresIn: '1h' },
    );
    const refreshToken = this.jwt.sign({ sub: '123' }, { expiresIn: '7d' });

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd, // for Postman / localhost
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ message: 'Cookies set' });
  }

  @Get('azure')
  @UseGuards(AuthGuard('azure-ad'))
  async azureLogin() {
    // passport redirect to Azure
  }

  @Get('azure/callback')
  @UseGuards(AuthGuard('azure-ad'))
  azureCallback(@Req() req, @Res() res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    console.log('Req.user:', req.user);
    const user = req.user;

    // Issue short-lived JWT
    // Issue short-lived access token
    const accessToken = this.jwt.sign(user, { expiresIn: '1h' });

    // Issue refresh token (store in DB or cache with expiration)
    const refreshToken = this.jwt.sign({ id: user.id }, { expiresIn: '7d' });

    // Save tokens in HTTP-only cookies
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }

  @Post('refresh')
  refresh(@Req() req: RequestWithCookies, @Res() res: Response) {
    const isProd = process.env.NODE_ENV === 'production';

    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(refreshToken, secret) as unknown;
      const payload = decoded as BackendJwtPayload;

      // Issue new short-lived access token
      const accessToken = this.jwt.sign(
        { id: payload.id },
        { expiresIn: '1h' },
      );

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      return res.json({ accessToken });
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const isProd = process.env.NODE_ENV === 'production';

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
    return { message: 'Logged out' };
  }
}
