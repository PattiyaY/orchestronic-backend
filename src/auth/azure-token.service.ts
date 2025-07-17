import { Injectable } from '@nestjs/common';

@Injectable()
export class AzureTokenService {
  async verifyAzureToken(token: string): Promise<any> {
    const { jwtVerify, createRemoteJWKSet } = await import('jose');
    const JWKS = createRemoteJWKSet(
      new URL(
        `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/discovery/v2.0/keys`,
      ),
    );

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      audience: process.env.AZURE_AD_CLIENT_ID,
    });

    return payload;
  }
}
