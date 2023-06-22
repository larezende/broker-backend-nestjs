import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';

@Injectable()
export class WalletAssetsService {
  constructor(private prismaService: PrismaService) {}

  all(filter: { walletId: string }) {
    return this.prismaService.walletAsset.findMany({
      where: {
        wallet_id: filter.walletId,
      },
      include: {
        Asset: {
          select: {
            id: true,
            symbol: true,
            price: true,
          },
        },
      },
    });
  }

  async create(input: { walletId: string; assetId: string; shares: number }) {
    const walletAsset = await this.prismaService.walletAsset.findUnique({
      where: {
        wallet_id_asset_id: {
          wallet_id: input.walletId,
          asset_id: input.assetId,
        },
      },
    });
    if (!walletAsset) {
      return this.prismaService.walletAsset.create({
        data: {
          wallet_id: input.walletId,
          asset_id: input.assetId,
          shares: input.shares,
          version: 1,
        },
      });
    }
  }
}
