import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('invites')
  async createInvite(@Request() req, @Body() createInviteDto: CreateInviteDto) {
    return this.adminService.createInvite(req.user.id, createInviteDto);
  }

  @Get('invites')
  async getAllInvites() {
    return this.adminService.getAllInvites();
  }

  @Get('users/pending')
  async getPendingUsers() {
    return this.adminService.getPendingUsers();
  }

  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/approve')
  async approveUser(@Param('id') id: string) {
    return this.adminService.approveUser(id);
  }

  @Delete('users/:id')
  async rejectUser(@Param('id') id: string) {
    return this.adminService.rejectUser(id);
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }
}
