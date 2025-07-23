export interface AzureADJwtPayload {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  upn?: string;
}

export interface RequestWithHeaders {
  headers: {
    authorization?: string;
  };
}
