/* eslint-disable @typescript-eslint/no-empty-interface */

declare namespace NodeJS {
    interface ProcessEnv {
        NEXTAUTH_SECRET?: string;
        DATABASE_URL?: string;
        NEXTAUTH_URL?: string;
        DEFAULT_PASSWORD?: string;
        NODE_ENV?: string;
        [key: string]: string | undefined;
    }
    interface Process {
        env: ProcessEnv;
    }
}
