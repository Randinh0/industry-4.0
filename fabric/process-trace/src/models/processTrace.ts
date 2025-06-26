export interface ProcessTrace {
  traceId: string;
  batchId: string;
  operation: string; // 'input', 'output', 'transfer', 'quality_check'
  quantity: number;
  fromLocation: string;
  toLocation: string;
  processId: string;
  operator: string;
  timestamp: number;
  traceHash: string;
  notes?: string;
  qualityData?: {
    temperature: number;
    humidity: number;
    pressure: number;
    qualityStatus: string;
  };
}

export interface BatchInfo {
  batchId: string;
  materialType: string;
  supplier: string;
  totalQuantity: number;
  currentQuantity: number;
  status: string; // 'active', 'completed', 'cancelled'
  createdAt: number;
  updatedAt: number;
} 