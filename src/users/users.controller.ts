import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * UsersController - HTTP endpoints for user CRUD
 * -------------------------------------------------------------------------
 * WHY CONTROLLER: In Nest, each controller is responsible for one "resource"
 * and maps HTTP methods + paths to service methods. Similar to defining routes
 * in Express or React Router, but with decorators (@Get(), @Post(), etc.).
 *
 * WHEN TO USE: Add a new endpoint by adding a method with @Get(), @Post(), etc.
 * Keep the method thin: parse params/query/body, call service, return result.
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (admin or public sign-up)' })
  @ApiResponse({ status: 201, description: 'User created (no password in response).' })
  @ApiResponse({ status: 400, description: 'Validation or i18n keys (e.g. common.ROLE_INVALID).' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (paginated, requires auth)' })
  findAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? Math.min(parseInt(take, 10), 100) : 20;
    return this.usersService.findAll(skipNum, takeNum);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one user by ID' })
  @ApiResponse({ status: 200, description: 'User object.' })
  @ApiResponse({ status: 404, description: 'common.USER_NOT_FOUND' })
  @ApiResponse({ status: 401, description: 'common.UNAUTHORIZED' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
