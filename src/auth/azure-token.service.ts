import { Injectable } from '@nestjs/common';

import { CustomJWTPayload } from '../lib/types';

import * as jwt from 'jsonwebtoken';

import * as https from 'https';
import * as path from 'path';
import * as fs from 'fs';
interface JWK {
  kid: string;

  x5c: string[];

  kty: string;

  use: string;
}

interface JWKS {
  keys: JWK[];
}

@Injectable()
export class AzureTokenService {
  private jwksCache = new Map<string, string>();

  private jwksCacheExpiry = new Map<string, number>();

  async verifyAzureToken(token: string): Promise<CustomJWTPayload | null> {
    try {
      // Decode token without verification to get the header

      const decoded = jwt.decode(token, { complete: true });

      if (
        !decoded ||
        typeof decoded === 'string' ||
        !decoded.header ||
        !decoded.header.kid
      ) {
        console.error('Invalid token structure or missing kid');

        return null;
      }

      const kid = decoded.header.kid;

      // Get the public key for this kid

      const publicKey = await this.getPublicKey(kid);

      if (!publicKey) {
        console.error('Could not retrieve public key');

        return null;
      }

      // First decode the token to get the payload for audience validation

      const decodedPayload = jwt.decode(token) as CustomJWTPayload;

      if (!decodedPayload) {
        console.error('Could not decode token payload');

        return null;
      }

      // Get tenant ID and client ID from the decoded token if env vars not set

      const tenantId =
        process.env.AZURE_AD_TENANT_ID ||
        decodedPayload.tid ||
        'c1f3dc23-b7f8-48d3-9b5d-2b12f158f01f';

      const clientId =
        process.env.AZURE_AD_CLIENT_ID ||
        decodedPayload.appid ||
        'bfbb98d5-f4cf-4d6b-b6fc-487eecff1c69';

      // Verify the token with the correct Azure AD audience format

      const payload = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],

        issuer: `https://sts.windows.net/${tenantId}/`,

        audience: `api://${clientId}`, // Azure AD uses api://client-id format
      }) as CustomJWTPayload;

      return payload;
    } catch (error) {
      console.error('Error verifying Azure token:', error);

      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',

        message: error instanceof Error ? error.message : String(error),

        stack: error instanceof Error ? error.stack : undefined,
      });

      return null;
    }
  }

  private async getPublicKey(kid: string): Promise<string | null> {
    try {
      // Check cache first

      const cached = this.jwksCache.get(kid);

      const cacheExpiry = this.jwksCacheExpiry.get(kid);

      if (cached && cacheExpiry && Date.now() < cacheExpiry) {
        return cached;
      }

      // Fetch JWKS using native https module

      // Use a fallback tenant ID if environment variable is not set

      const tenantId =
        process.env.AZURE_AD_TENANT_ID ||
        'c1f3dc23-b7f8-48d3-9b5d-2b12f158f01f';

      const jwksUri = `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`;

      const jwks = await this.fetchJWKS(jwksUri);

      if (!jwks || !jwks.keys) {
        console.error('Invalid JWKS response');

        return null;
      }

      // Find the key with matching kid

      const key = jwks.keys.find((k) => k.kid === kid);

      if (!key || !key.x5c || key.x5c.length === 0) {
        console.error('Key not found in JWKS for kid:', kid);

        return null;
      }

      // Convert x5c certificate to PEM format

      const cert = key.x5c[0];

      const publicKey = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----`;

      // Cache the key for 1 hour

      this.jwksCache.set(kid, publicKey);

      this.jwksCacheExpiry.set(kid, Date.now() + 60 * 60 * 1000);

      return publicKey;
    } catch (error) {
      console.error('Error getting public key:', error);

      return null;
    }
  }

  private fetchJWKS(url: string): Promise<JWKS> {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            const jwks = JSON.parse(data) as JWKS;

            resolve(jwks);
          } catch {
            reject(new Error('Failed to parse JWKS JSON'));
          }
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.setTimeout(10000, () => {
        request.abort();

        reject(new Error('JWKS request timeout'));
      });
    });
  }
}
