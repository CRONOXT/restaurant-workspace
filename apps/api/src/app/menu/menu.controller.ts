import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { Prisma } from '@prisma/client';

@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  create(@Body() createMenuDto: Prisma.MenuCreateInput) {
    return this.menuService.create(createMenuDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.menuService.findAll(search, page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateMenuDto: Prisma.MenuUpdateInput) {
    return this.menuService.update(id, updateMenuDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuService.remove(id);
  }
}
