export interface CustomJWTPayload {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  oid?: string;
  upn?: string;
  iss?: string;
  sub?: string;
  aud?: string | string[];
  jti?: string;
  nbf?: number;
  exp?: number;
  iat?: number;
  tid?: string;
  appid?: string;
}

export interface RequestWithHeaders {
  headers: {
    authorization?: string;
  };
}
