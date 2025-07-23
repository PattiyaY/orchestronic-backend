import { Injectable } from '@nestjs/common';
import * as jwkToPem from 'jwk-to-pem';
import axios, { AxiosResponse } from 'axios';
import { JwtHeader } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';

interface AzureADKeys {
  keys: Array<{
    kty: string;
    use: string;
    kid: string;
    n: string;
    e: string;
    x5c: string[];
    cloud_instance_name: string;
    issuer: string;
  }>;
}

@Injectable()
export class AuthService {
  constructor() {}

  extractKidFromToken(token: string): string | null {
    try {
      const decoded = jwt.decode(token, { complete: true }) as {
        header: JwtHeader;
      };
      return decoded?.header?.kid || null;
    } catch (err) {
      console.error('Failed to decode token:', err);
      return null;
    }
  }

  async getAzurePemKey(kid: string | null): Promise<string> {
    if (!kid) {
      throw new Error('KID is null');
    }
    const jwksRes: AxiosResponse<AzureADKeys> = await axios.get(
      `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/discovery/v2.0/keys`,
    );
    const jwk: AzureADKeys['keys'][number] | undefined = jwksRes.data.keys.find(
      (key) => key.kid === kid,
    );

    if (!jwk) {
      throw new Error(`No JWK found for KID: ${kid}`);
    }

    try {
      const pem = jwkToPem(jwk) as string;
      return pem;
    } catch (err) {
      console.error('Failed to convert JWK to PEM:', err);
      throw err;
    }
  }
}
