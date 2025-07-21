import { Injectable } from '@nestjs/common';
import { CustomJWTPayload } from 'src/lib/types';

@Injectable()
export class AzureTokenService {
  async verifyAzureToken(token: string): Promise<CustomJWTPayload | null> {
    try {
      // Dynamic import for ESM module
      const { jwtVerify, createRemoteJWKSet, decodeJwt } = await import('jose');

      let decoded: CustomJWTPayload;
      try {
        decoded = decodeJwt(token);
      } catch {
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

      return payload as CustomJWTPayload;
    } catch (error) {
      console.error('Error verifying Azure token:', error);
      return null;
    }
  }
}
