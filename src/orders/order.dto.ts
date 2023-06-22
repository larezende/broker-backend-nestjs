import { OrderType } from '@prisma/client';
import { OrderStatus } from '.prisma/client';

export class InitTransactionDto {
  assetId: string;
  walletId: string;
  shares: number;
  price: number;
  type: OrderType;
}

export class InputExecuteTransactionDto {
  orderId: string;
  status: OrderStatus;
  relatedInvestorId: string;
  brokerTransactionId: string;
  negotiatedShares: number;
  price: number;
}

export class ExecuteTransactionMessageDto {
  order_id: string;
  investor_id: string;
  asset_id: string;
  order_type: string;
  status: 'OPEN' | 'CLOSED';
  partial: number;
  shares: number;
  transactions: {
    transaction_id: string;
    buyer_id: string;
    seller_id: string;
    asset_id: string;
    shares: number;
    price: number;
  }[];
}
