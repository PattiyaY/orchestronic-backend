import { Injectable } from '@nestjs/common';
import { CustomJWTPayload } from 'src/lib/types';

@Injectable()
export class AzureTokenService {
  async verifyAzureToken(token: string): Promise<CustomJWTPayload | null> {
    let decoded: CustomJWTPayload;

    try {
      console.log('Step 1: Attempting to import jose library...');
      const { decodeJwt } = await import('jose');
      console.log('Step 2: Successfully imported jose, decoding token...');
      decoded = decodeJwt(token);
      console.log('Step 3: Token decoded successfully:', decoded);
    } catch (error) {
      console.error(
        'Step 1-3 Failed - Error importing jose or decoding token:',
        error,
      );
      return null;
    }

    try {
      console.log('Step 4: Importing jose for verification...');
      const { jwtVerify, createRemoteJWKSet } = await import('jose');
      console.log('Step 5: Creating JWKS...');

      const JWKS = createRemoteJWKSet(
        new URL(
          `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/discovery/keys`,
        ),
      );

      console.log('Step 6: Verifying token...');
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: decoded.iss,
        audience: decoded.aud,
      });

      console.log('Step 7: Token verified successfully:', payload);
      return payload as CustomJWTPayload;
    } catch (error) {
      console.error('Step 4-7 Failed - Error verifying token:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      return null;
    }
  }
}
