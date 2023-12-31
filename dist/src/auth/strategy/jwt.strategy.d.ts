import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(config: ConfigService, prisma: PrismaService);
    validate(payload: {
        sub: number;
        email: string;
        role: string;
    }): Promise<{
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        password: string;
        resetToken: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
