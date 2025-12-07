import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';
import { PrivacyLevel } from '@prisma/client';

@Injectable()
export class SpotsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createSpotDto: CreateSpotDto) {
    return this.prisma.spot.create({
      data: {
        ...createSpotDto,
        creatorId: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
      },
    });
  }

  async findAll(userId?: string) {
    const where: any = {
      OR: [
        { privacyLevel: PrivacyLevel.PUBLIC },
        ...(userId ? [{ creatorId: userId, privacyLevel: PrivacyLevel.PRIVATE }] : []),
      ],
    };

    return this.prisma.spot.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number = 10, userId?: string) {
    const spots = await this.findAll(userId);

    return spots.filter((spot) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        spot.latitude,
        spot.longitude,
      );
      return distance <= radiusKm;
    }).map((spot) => ({
      ...spot,
      distance: this.calculateDistance(
        latitude,
        longitude,
        spot.latitude,
        spot.longitude,
      ),
    })).sort((a, b) => a.distance - b.distance);
  }

  async findOne(id: string, userId?: string) {
    const spot = await this.prisma.spot.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
      },
    });

    if (!spot) {
      throw new NotFoundException('Spot not found');
    }

    if (spot.privacyLevel === PrivacyLevel.PRIVATE && spot.creatorId !== userId) {
      throw new ForbiddenException('You do not have access to this spot');
    }

    return spot;
  }

  async update(id: string, userId: string, updateSpotDto: UpdateSpotDto) {
    const spot = await this.prisma.spot.findUnique({
      where: { id },
    });

    if (!spot) {
      throw new NotFoundException('Spot not found');
    }

    if (spot.creatorId !== userId) {
      throw new ForbiddenException('You can only update your own spots');
    }

    return this.prisma.spot.update({
      where: { id },
      data: updateSpotDto,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const spot = await this.prisma.spot.findUnique({
      where: { id },
    });

    if (!spot) {
      throw new NotFoundException('Spot not found');
    }

    if (spot.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own spots');
    }

    return this.prisma.spot.delete({
      where: { id },
    });
  }

  async getStats() {
    const totalSpots = await this.prisma.spot.count();
    const publicSpots = await this.prisma.spot.count({
      where: { privacyLevel: PrivacyLevel.PUBLIC },
    });
    const privateSpots = await this.prisma.spot.count({
      where: { privacyLevel: PrivacyLevel.PRIVATE },
    });
    const friendsOnlySpots = await this.prisma.spot.count({
      where: { privacyLevel: PrivacyLevel.FRIENDS_ONLY },
    });

    return {
      totalSpots,
      publicSpots,
      privateSpots,
      friendsOnlySpots,
    };
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
