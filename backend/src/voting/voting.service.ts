import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Role, VoteType, VoteStatus, VoteDecision } from '@prisma/client';

@Injectable()
export class VotingService {
  constructor(private prisma: PrismaService) {}

  async createVote(
    creatorId: string,
    targetUserId: string,
    type: VoteType,
    reason?: string,
  ) {
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
    });

    if (creator.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only SuperAdmins can create votes');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    if (type === VoteType.REMOVE_SUPERADMIN && targetUser.role !== Role.SUPERADMIN) {
      throw new BadRequestException('Target user is not a SuperAdmin');
    }

    if (type === VoteType.REMOVE_ADMIN && targetUser.role !== Role.ADMIN) {
      throw new BadRequestException('Target user is not an Admin');
    }

    const activeVote = await this.prisma.vote.findFirst({
      where: {
        targetUserId,
        status: VoteStatus.ACTIVE,
      },
    });

    if (activeVote) {
      throw new BadRequestException(
        'There is already an active vote for this user',
      );
    }

    const superAdminCount = await this.prisma.user.count({
      where: { role: Role.SUPERADMIN },
    });

    const requiredVotes = Math.ceil(superAdminCount / 2);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return this.prisma.vote.create({
      data: {
        type,
        targetUserId,
        createdById: creatorId,
        reason,
        requiredVotes,
        expiresAt,
      },
      include: {
        targetUser: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  async castVote(
    voteId: string,
    userId: string,
    decision: VoteDecision,
    comment?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only SuperAdmins can vote');
    }

    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
      include: {
        participants: true,
        targetUser: true,
      },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    if (vote.status !== VoteStatus.ACTIVE) {
      throw new BadRequestException('Vote is not active');
    }

    if (new Date() > vote.expiresAt) {
      await this.prisma.vote.update({
        where: { id: voteId },
        data: { status: VoteStatus.EXPIRED },
      });
      throw new BadRequestException('Vote has expired');
    }

    if (vote.targetUser.id === userId) {
      throw new ForbiddenException('You cannot vote on your own demotion');
    }

    const existingParticipant = vote.participants.find(
      (p) => p.userId === userId,
    );

    if (existingParticipant) {
      throw new BadRequestException('You have already voted');
    }

    await this.prisma.voteParticipant.create({
      data: {
        voteId,
        userId,
        decision,
      },
    });

    if (comment) {
      await this.prisma.voteComment.create({
        data: {
          voteId,
          userId,
          comment,
        },
      });
    }

    const updatedVote = await this.prisma.vote.update({
      where: { id: voteId },
      data: {
        approveCount: decision === VoteDecision.APPROVE
          ? { increment: 1 }
          : undefined,
        rejectCount: decision === VoteDecision.REJECT
          ? { increment: 1 }
          : undefined,
      },
      include: {
        participants: true,
      },
    });

    if (updatedVote.approveCount >= updatedVote.requiredVotes) {
      await this.finalizeVote(voteId, VoteStatus.APPROVED);
    } else if (updatedVote.rejectCount >= updatedVote.requiredVotes) {
      await this.finalizeVote(voteId, VoteStatus.REJECTED);
    }

    return this.getVoteById(voteId);
  }

  private async finalizeVote(voteId: string, status: VoteStatus) {
    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
      include: { targetUser: true },
    });

    const closedAt = new Date();
    const cleanupAt = new Date(closedAt);
    cleanupAt.setHours(cleanupAt.getHours() + 1);

    await this.prisma.vote.update({
      where: { id: voteId },
      data: {
        status,
        closedAt,
        cleanupAt,
      },
    });

    if (status === VoteStatus.APPROVED) {
      if (vote.type === VoteType.REMOVE_SUPERADMIN) {
        await this.prisma.user.update({
          where: { id: vote.targetUserId },
          data: { role: Role.ADMIN },
        });
      } else if (vote.type === VoteType.REMOVE_ADMIN) {
        await this.prisma.user.update({
          where: { id: vote.targetUserId },
          data: { role: Role.USER },
        });
      }
    }
  }

  async getActiveVotes() {
    return this.prisma.vote.findMany({
      where: {
        status: VoteStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      include: {
        targetUser: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVoteHistory() {
    return this.prisma.vote.findMany({
      where: {
        status: { in: [VoteStatus.APPROVED, VoteStatus.REJECTED, VoteStatus.EXPIRED] },
      },
      include: {
        targetUser: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { closedAt: 'desc' },
      take: 50,
    });
  }

  async getVoteById(voteId: string) {
    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
      include: {
        targetUser: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    return vote;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleExpiredVotes() {
    const expiredVotes = await this.prisma.vote.findMany({
      where: {
        status: VoteStatus.ACTIVE,
        expiresAt: { lt: new Date() },
      },
    });

    for (const vote of expiredVotes) {
      await this.finalizeVote(vote.id, VoteStatus.EXPIRED);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async cleanupOldVotes() {
    const votesToCleanup = await this.prisma.vote.findMany({
      where: {
        cleanupAt: { lt: new Date() },
      },
    });

    for (const vote of votesToCleanup) {
      await this.prisma.voteComment.deleteMany({
        where: { voteId: vote.id },
      });

      await this.prisma.voteParticipant.deleteMany({
        where: { voteId: vote.id },
      });

      await this.prisma.vote.delete({
        where: { id: vote.id },
      });
    }
  }
}
