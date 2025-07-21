// Use type-only import to avoid runtime import issues
export interface CustomJWTPayload {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  oid?: string;
  upn?: string;
  // Include standard JWT payload properties
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
}
