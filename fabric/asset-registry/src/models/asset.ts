export interface Asset {
  assetId: string;
  owner: string;
  location: string;
  type: string;
  metadataIoT: Record<string, any>;
  createdAt: number;
  updatedAt: number;
} 