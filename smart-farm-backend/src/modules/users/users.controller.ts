// src/modules/users/users.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  HttpCode,
  HttpStatus,
  Res
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.usersService.create(createUserDto);
    
    // Automatically log the user in after registration
    const payload = { 
      email: user.email, 
      sub: user.user_id,
      role: user.role 
    };
    const token = this.jwtService.sign(payload);
    
    res.cookie('sf_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      path: '/',
    });
    
    return { user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginUserDto) {
    return this.usersService.validateUser(loginDto);
  }

  @Get()
  async findAll(@Query('includeFarms') includeFarms?: string) {
    const shouldIncludeFarms = includeFarms === 'true';
    return this.usersService.findAll(shouldIncludeFarms);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('includeFarms') includeFarms?: string
  ) {
    const shouldIncludeFarms = includeFarms === 'true';
    return this.usersService.findOne(id, shouldIncludeFarms);
  }

  @Get(':id/farms')
  async getUserFarms(@Param('id') id: string) {
    return this.usersService.getUserFarms(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/password')
  async updatePassword(
    @Param('id') id: string,
    @Body() body: { password: string }
  ) {
    await this.usersService.updatePassword(id, body.password);
    return { message: 'Password updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }
}