import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { SpotsService } from './spots.service';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('spots')
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createSpotDto: CreateSpotDto) {
    return this.spotsService.create(req.user.id, createSpotDto);
  }

  @Get()
  findAll(@Request() req) {
    const userId = req.user?.id;
    return this.spotsService.findAll(userId);
  }

  @Get('nearby')
  findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string,
    @Request() req,
  ) {
    const userId = req.user?.id;
    const radiusKm = radius ? parseFloat(radius) : 10;
    return this.spotsService.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      radiusKm,
      userId,
    );
  }

  @Get('stats')
  getStats() {
    return this.spotsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id;
    return this.spotsService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateSpotDto: UpdateSpotDto,
  ) {
    return this.spotsService.update(id, req.user.id, updateSpotDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.spotsService.remove(id, req.user.id);
  }
}
