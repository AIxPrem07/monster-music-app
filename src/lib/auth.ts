import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'PLACEHOLDER_CLIENT_ID',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'PLACEHOLDER_CLIENT_SECRET',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'monster_music_app_super_secret_jwt_key_2026_fallback',
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          // Upsert user in our custom Neon DB User table
          await prisma.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name || 'Monster User',
              avatarUrl: user.image || null,
              googleId: account.providerAccountId,
            },
            create: {
              email: user.email,
              name: user.name || 'Monster User',
              avatarUrl: user.image || null,
              googleId: account.providerAccountId,
            },
          });
        } catch (error) {
          console.error('Error upserting user in DB during signIn:', error);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
