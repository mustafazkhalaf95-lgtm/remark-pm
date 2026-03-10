/// <reference types="node" />
/* ══════════════════════════════════════════════════════════
   Remark PM — NextAuth Configuration
   Real authentication with Prisma + bcrypt.
   ══════════════════════════════════════════════════════════ */

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { loadUserRoles, loadUserPermissions, loadUserDepartments } from '@/lib/auth';

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                // Look up user in database
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email.toLowerCase().trim() },
                    include: {
                        profile: { include: { position: true } },
                        userRoles: { include: { role: true } },
                        userDepartments: { select: { departmentId: true } },
                    },
                });

                if (!user) return null;

                // Check user status
                if (user.status !== 'active') return null;

                // Verify password with bcrypt
                // If password is empty (legacy/seeded user), allow first login to set password
                if (user.password) {
                    const isValid = await bcrypt.compare(credentials.password, user.password);
                    if (!isValid) return null;
                } else {
                    // First login — hash and save the password
                    const hashed = await bcrypt.hash(credentials.password, 12);
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { password: hashed },
                    });
                }

                // Update last login
                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLoginAt: new Date() },
                });

                // Get primary role
                const primaryRole = user.userRoles.find((ur) => ur.isPrimary)?.role?.name
                    || user.userRoles[0]?.role?.name
                    || 'MEMBER';

                // Get all role names
                const roles = user.userRoles.map((ur) => ur.role.name);

                // Get department IDs
                const departments = user.userDepartments.map((ud) => ud.departmentId);

                // Get permissions
                const permissions = await loadUserPermissions(user.id);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.profile?.fullName || user.profile?.displayName || user.email,
                    nameAr: user.profile?.fullNameAr || user.profile?.displayNameAr || '',
                    avatar: user.profile?.avatar || '',
                    role: primaryRole,
                    roles,
                    permissions,
                    departments,
                    positionLevel: user.profile?.position?.level || 0,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.roles = user.roles;
                token.permissions = user.permissions;
                token.departments = user.departments;
                token.positionLevel = user.positionLevel;
                token.nameAr = user.nameAr;
                token.avatar = user.avatar;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.roles = token.roles || [];
                session.user.permissions = token.permissions || [];
                session.user.departments = token.departments || [];
                session.user.positionLevel = token.positionLevel || 0;
                session.user.nameAr = token.nameAr || '';
                session.user.avatar = token.avatar || '';
            }
            return session;
        },
    },
    pages: { signIn: '/login' },
    session: { strategy: 'jwt' as const, maxAge: 24 * 60 * 60 }, // 24 hours
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
