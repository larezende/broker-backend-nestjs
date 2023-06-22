import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WalletAssetsService } from './wallet-assets.service';

@Controller('wallets/:walletId/assets')
export class WalletAssetsController {
  constructor(private walletAssetsService: WalletAssetsService) {}

  @Get()
  all(@Param('walletId') walletId: string) {
    return this.walletAssetsService.all({ walletId });
  }

  @Post()
  create(
    @Param('walletId') walletId: string,
    @Body() body: { assetId: string; shares: number },
  ) {
    return this.walletAssetsService.create({
      walletId: walletId,
      ...body,
    });
  }
}
