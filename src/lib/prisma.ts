// Prisma client stub — schema.prisma is missing from this repo
// This allows the build to pass; API routes will fail at runtime until DB is set up
// TODO: Restore schema.prisma and run `npx prisma generate` to get the real client

const handler = {
    get(_target: any, prop: string): any {
        if (prop === '$queryRawUnsafe' || prop === '$executeRawUnsafe') {
            return async () => { throw new Error('Database not configured — schema.prisma missing'); };
        }
        // Return a proxy for any model access (e.g., prisma.user.findMany)
        return new Proxy({}, {
            get(_t: any, method: string) {
                return async () => { throw new Error(`Database not configured — prisma.${prop}.${method}() called but schema.prisma is missing`); };
            }
        });
    }
};

const prisma = new Proxy({}, handler);

export default prisma;
