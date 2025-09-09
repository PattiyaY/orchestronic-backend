import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { InfrastructureService } from './infrastructure.service';
import { CreateInfrastructureDto } from './dto/create-infrastructure.dto';
import { UpdateInfrastructureDto } from './dto/update-infrastructure.dto';

@Controller('infrastructure')
export class InfrastructureController {
  constructor(private readonly infrastructureService: InfrastructureService) {}

  @Post()
  create(@Body() createInfrastructureDto: CreateInfrastructureDto) {
    return this.infrastructureService.create(createInfrastructureDto);
  }

  @Get()
  findAll() {
    return this.infrastructureService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.infrastructureService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInfrastructureDto: UpdateInfrastructureDto,
  ) {
    return this.infrastructureService.update(+id, updateInfrastructureDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.infrastructureService.remove(+id);
  }
}
