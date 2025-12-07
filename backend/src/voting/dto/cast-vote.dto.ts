import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VoteDecision } from '@prisma/client';

export class CastVoteDto {
  @IsEnum(VoteDecision)
  decision: VoteDecision;

  @IsOptional()
  @IsString()
  comment?: string;
}
