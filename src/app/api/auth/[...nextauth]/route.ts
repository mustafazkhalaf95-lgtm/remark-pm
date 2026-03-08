/// <reference types="node" />
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                // Stub — DB not configured yet (schema.prisma missing)
                // TODO: Replace with real Prisma user lookup + bcrypt verify
                if (!credentials?.email || !credentials?.password) return null;
                return { id: 'stub', email: credentials.email, name: 'User', role: 'MEMBER' };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) { token.id = user.id; token.role = user.role; }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) { (session.user as any).id = token.id; (session.user as any).role = token.role; }
            return session;
        },
    },
    pages: { signIn: '/login' },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
