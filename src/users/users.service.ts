import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { User } from '../generated/prisma';

export type { User };

/**
 * UsersService - Business logic for user CRUD
 * -------------------------------------------------------------------------
 * WHY SERVICE: In Nest, controllers only handle HTTP (request/response).
 * All business logic (DB calls, hashing, checks) lives in services. This
 * keeps controllers thin and makes services reusable (e.g. from AuthService).
 *
 * WHEN TO USE: Inject UsersService in UsersController and in AuthService
 * (for registration). Never put Prisma or business logic inside a controller.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Salt rounds for bcrypt. Higher = more secure but slower. 10–12 is common.
   */
  private readonly SALT_ROUNDS = 10;

  /**
   * Hash password before storing. Never store plain text passwords.
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Create a new user. Used by POST /users and by Auth (sign-up).
   */
  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }
    const hashedPassword = await this.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role ?? 'user',
      },
    });
    return this.omitPassword(user);
  }

  /**
   * Get all users (paginated). Used by GET /users.
   */
  async findAll(skip = 0, take = 20) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return {
      data: users.map((u) => this.omitPassword(u)),
      total,
      skip,
      take,
    };
  }

  /**
   * Get one user by id. Used by GET /users/:id.
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return this.omitPassword(user);
  }

  /**
   * Find by email - used by Auth (login). Returns user with password for verification.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Update user. Used by PATCH /users/:id.
   */
  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const data: {
      name?: string;
      password?: string;
      role?: string;
      isActive?: boolean;
    } = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password) {
      data.password = await this.hashPassword(dto.password);
    }
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return this.omitPassword(user);
  }

  /**
   * Delete user. Used by DELETE /users/:id.
   */
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({
      where: { id },
    });
    return { message: 'User deleted successfully' };
  }

  /**
   * Remove password from user object before sending to client. Never expose hashes.
   */
  omitPassword<T extends { password?: string }>(user: T): Omit<T, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...rest } = user;
    return rest;
  }
}
