import { IsString, IsEnum, IsOptional } from 'class-validator';
import { VoteType } from '@prisma/client';

export class CreateVoteDto {
  @IsString()
  targetUserId: string;

  @IsEnum(VoteType)
  type: VoteType;

  @IsOptional()
  @IsString()
  reason?: string;
}
