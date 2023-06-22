import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma/prisma.service';
import { InitTransactionDto, InputExecuteTransactionDto } from './order.dto';
import { OrderStatus, OrderType } from '.prisma/client';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class OrdersService {
  constructor(
    private prismaService: PrismaService,
    @Inject('ORDERS_PUBLISHER')
    private readonly kafkaClient: ClientKafka,
  ) {}

  all(filter: { walletId: string }) {
    return this.prismaService.order.findMany({
      where: {
        wallet_id: filter.walletId,
      },
      include: {
        Transactions: true,
        Asset: {
          select: {
            id: true,
            symbol: true,
          },
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
    });
  }

  async initTransaction(input: InitTransactionDto) {
    const order = await this.prismaService.order.create({
      data: {
        wallet_id: input.walletId,
        asset_id: input.assetId,
        shares: input.shares,
        price: input.price,
        type: input.type,
        status: OrderStatus.PENDING,
        partial: input.shares,
        version: 1,
      },
    });
    this.kafkaClient.emit('input', {
      order_id: order.id,
      investor_id: order.wallet_id,
      asset_id: order.asset_id,
      shares: order.shares,
      price: order.price,
      order_type: order.type,
    });
    return order;
  }

  async executeTransaction(input: InputExecuteTransactionDto) {
    return this.prismaService.$transaction(async (prismaTransaction) => {
      const order = await prismaTransaction.order.findUniqueOrThrow({
        where: { id: input.orderId },
      });
      await prismaTransaction.order.update({
        where: {
          id: input.orderId,
          version: order.version,
        },
        data: {
          partial: order.partial - input.negotiatedShares,
          status: input.status,
          Transactions: {
            create: {
              broker_transaction_id: input.brokerTransactionId,
              related_investor_id: input.relatedInvestorId,
              shares: input.negotiatedShares,
              price: input.price,
            },
          },
          version: { increment: 1 },
        },
      });

      if (input.status === OrderStatus.CLOSED) {
        await prismaTransaction.order.update({
          where: { id: input.orderId },
          data: {
            price: input.price,
          },
        });

        const walletAsset = await prismaTransaction.walletAsset.findUnique({
          where: {
            wallet_id_asset_id: {
              asset_id: order.asset_id,
              wallet_id: order.wallet_id,
            },
          },
        });
        if (walletAsset) {
          await prismaTransaction.walletAsset.update({
            where: {
              wallet_id_asset_id: {
                asset_id: order.asset_id,
                wallet_id: order.wallet_id,
              },
              version: walletAsset.version,
            },
            data: {
              shares:
                order.type === OrderType.BUY
                  ? walletAsset.shares + order.shares
                  : walletAsset.shares - order.shares,
              version: { increment: 1 },
            },
          });
        } else {
          await prismaTransaction.walletAsset.create({
            data: {
              asset_id: order.asset_id,
              wallet_id: order.wallet_id,
              shares: input.negotiatedShares,
              version: 1,
            },
          });
        }
      }
    });
  }
}
