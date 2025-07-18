import { Injectable } from '@nestjs/common';

@Injectable()
export class AzureTokenService {
  async verifyAzureToken(token: string): Promise<any> {
    const { jwtVerify, createRemoteJWKSet, decodeJwt } = await import('jose');

    const decoded = decodeJwt(token);

    const JWKS = createRemoteJWKSet(
      new URL(
        `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/discovery/keys`,
      ),
    );

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: decoded.iss,
      audience: decoded.aud,
    });

    return payload;
  }
}
