import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ExecuteTransactionMessageDto, InitTransactionDto, InputExecuteTransactionDto } from './order.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('wallets/:walletId/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  all(@Param('walletId') walletId) {
    return this.ordersService.all(walletId);
  }

  @Post()
  initTransaction(
    @Param('walletId') walletId: string,
    @Body() body: Omit<InitTransactionDto, 'walletId'>,
  ) {
    return this.ordersService.initTransaction({ ...body, walletId });
  }

  @Post('execute')
  executeTransactionRest(@Body() body: InputExecuteTransactionDto) {
    return this.ordersService.executeTransaction(body);
  }

  @MessagePattern('output')
  async executeTransactionConsumer(
    @Payload() message: ExecuteTransactionMessageDto,
  ) {
    const transaction = message.transactions[message.transactions.length - 1];
    await this.ordersService.executeTransaction({
      orderId: message.order_id,
      status: message.status,
      relatedInvestorId:
        message.order_type === 'BUY'
          ? transaction.seller_id
          : transaction.buyer_id,
      brokerTransactionId: transaction.transaction_id,
      negotiatedShares: transaction.shares,
      price: transaction.price,
    });
  }
}
