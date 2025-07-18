import { Injectable } from '@nestjs/common';
import { jwtVerify, createRemoteJWKSet, decodeJwt } from 'jose';

@Injectable()
export class AzureTokenService {
  async verifyAzureToken(token: string): Promise<any> {
    let decoded;
    try {
      decoded = decodeJwt(token);
    } catch (error) {
      return null;
    }

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
