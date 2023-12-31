"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const library_1 = require("@prisma/client/runtime/library");
const argon = require("argon2");
const jwt_1 = require("@nestjs/jwt");
let AuthService = class AuthService {
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    async signup(dto) {
        const password = await argon.hash(dto.password);
        try {
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    password,
                },
                select: {
                    id: true,
                    email: true,
                    createdAt: true,
                },
            });
            return user;
        }
        catch (error) {
            if (error instanceof library_1.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new common_1.ForbiddenException('Cet email est déjà enregistré');
                }
            }
            throw error;
        }
    }
    async signin(dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });
        if (!user)
            throw new common_1.ForbiddenException('Utilisateur et/ou mot de passe incorrects');
        const passwordMatches = await argon.verify(user.password, dto.password);
        if (!passwordMatches)
            throw new common_1.ForbiddenException('Utilisateur et/ou mot de passe incorrects');
        return this.signToken(user.id, user.email, user.role);
    }
    async signToken(userId, email, role) {
        const payload = {
            sub: userId,
            email,
            role,
        };
        const secret = this.config.get('JWT_SECRET');
        const token = await this.jwt.signAsync(payload, {
            expiresIn: '1h',
            secret: secret,
        });
        return { access_token: token };
    }
    async validateUser(token) {
        try {
            const secret = this.config.get('JWT_SECRET');
            const decodedToken = await this.jwt.verifyAsync(token, {
                secret: secret,
            });
            return decodedToken;
        }
        catch (error) {
            throw new common_1.ForbiddenException('Invalid token');
        }
    }
    async resetPasswordRequest(email) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    email: email,
                },
            });
            if (!user) {
                throw new common_1.NotFoundException("L'email n'a pas été trouvé");
            }
            const secret = this.config.get('JWT_SECRET');
            const payload = { userId: user.id };
            const resetToken = await this.jwt.signAsync(payload, {
                secret: secret,
                expiresIn: '1h',
            });
            await this.prisma.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    resetToken,
                },
            });
            return resetToken;
        }
        catch (error) {
            throw new common_1.ForbiddenException(error.message);
        }
    }
    async validateResetToken(token) {
        try {
            const user = await this.prisma.user.findFirst({
                where: {
                    resetToken: token,
                },
            });
            if (!user) {
                throw new common_1.NotFoundException('Token not found');
            }
            return user.id;
        }
        catch (error) {
            throw new common_1.ForbiddenException(error.message);
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map