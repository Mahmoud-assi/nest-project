import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

/**
 * UsersModule - groups everything related to "users"
 * -------------------------------------------------------------------------
 * WHY MODULES: Nest organizes the app into modules. Each feature (users, auth)
 * has its own module that declares its controller and service, and can
 * import other modules if needed. AppModule then imports these feature modules.
 *
 * WHEN TO USE: Import UsersModule in AppModule. If another module needs
 * UsersService (e.g. AuthModule), import UsersModule there and inject UsersService.
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
