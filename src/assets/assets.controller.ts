import { Body, Controller, Get, Post } from '@nestjs/common';
import { AssetsService } from './assets.service';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  getAll() {
    return this.assetsService.all();
  }

  @Post()
  create(@Body() body: { id: string; symbol: string; price: number }) {
    console.log(body);
    return this.assetsService.create(body);
  }
}
