import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VotingService } from './voting.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('voting')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN)
export class VotingController {
  constructor(private readonly votingService: VotingService) {}

  @Post()
  async createVote(@Request() req, @Body() createVoteDto: CreateVoteDto) {
    return this.votingService.createVote(
      req.user.id,
      createVoteDto.targetUserId,
      createVoteDto.type,
      createVoteDto.reason,
    );
  }

  @Post(':id/cast')
  async castVote(
    @Request() req,
    @Param('id') voteId: string,
    @Body() castVoteDto: CastVoteDto,
  ) {
    return this.votingService.castVote(
      voteId,
      req.user.id,
      castVoteDto.decision,
      castVoteDto.comment,
    );
  }

  @Get('active')
  async getActiveVotes() {
    return this.votingService.getActiveVotes();
  }

  @Get('history')
  async getVoteHistory() {
    return this.votingService.getVoteHistory();
  }

  @Get(':id')
  async getVoteById(@Param('id') voteId: string) {
    return this.votingService.getVoteById(voteId);
  }
}
