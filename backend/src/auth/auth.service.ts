import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password, inviteCode, instagramHandle } =
      registerDto;

    if (!username.startsWith('@')) {
      throw new BadRequestException('Username must start with @');
    }

    const invite = await this.prisma.invite.findUnique({
      where: { code: inviteCode },
    });

    if (!invite) {
      throw new BadRequestException('Invalid invite code');
    }

    if (invite.isUsed) {
      throw new BadRequestException('Invite code has already been used');
    }

    if (new Date() > invite.expiresAt) {
      throw new BadRequestException('Invite code has expired');
    }

    if (invite.email !== email) {
      throw new BadRequestException(
        'Email does not match the invite',
      );
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        passwordHash: hashedPassword,
        instagramHandle,
        invitedBy: invite.id,
        isApproved: false,
      },
    });

    await this.prisma.invite.update({
      where: { id: invite.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    return {
      message: 'Registration successful. Awaiting admin approval.',
      userId: user.id,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isApproved) {
      throw new UnauthorizedException(
        'Your account is pending admin approval',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        instagramHandle: user.instagramHandle,
        profileImage: user.profileImage,
      },
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isApproved: true,
        instagramHandle: true,
        profileImage: true,
      },
    });
  }
}
