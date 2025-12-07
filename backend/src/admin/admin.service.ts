import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async createInvite(adminId: string, createInviteDto: CreateInviteDto) {
    const { email } = createInviteDto;

    const code = randomBytes(16).toString('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 5);

    const invite = await this.prisma.invite.create({
      data: {
        code,
        email,
        createdBy: adminId,
        expiresAt,
      },
    });

    return {
      inviteCode: invite.code,
      email: invite.email,
      expiresAt: invite.expiresAt,
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?invite=${invite.code}`,
    };
  }

  async getAllInvites() {
    return this.prisma.invite.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        email: true,
        isUsed: true,
        usedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async getPendingUsers() {
    return this.prisma.user.findMany({
      where: { isApproved: false },
      select: {
        id: true,
        email: true,
        username: true,
        instagramHandle: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        instagramHandle: true,
        role: true,
        isApproved: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isApproved: true },
    });
  }

  async rejectUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async getStats() {
    const totalUsers = await this.prisma.user.count();
    const approvedUsers = await this.prisma.user.count({
      where: { isApproved: true },
    });
    const pendingUsers = await this.prisma.user.count({
      where: { isApproved: false },
    });
    const totalSpots = await this.prisma.spot.count();
    const publicSpots = await this.prisma.spot.count({
      where: { privacyLevel: 'PUBLIC' },
    });

    return {
      totalUsers,
      approvedUsers,
      pendingUsers,
      totalSpots,
      publicSpots,
    };
  }
}
