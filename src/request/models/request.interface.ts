export interface Request {
  team: string;
  repository: string;
  resourceGroup: string;
  resources: {
    VM: number;
    DB: number;
    ST: number;
  };
  region: string;
  cloudProvider: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  userId: string;
  description: string;
  date: Date;
}
