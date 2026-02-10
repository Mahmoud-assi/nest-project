/**
 * Role values matching the Prisma Role enum.
 * Use this in decorators, guards, and controllers so we don't depend on
 * @prisma/client export resolution (which can fail with pnpm/custom layouts).
 * For actual DB types and PrismaClient, continue using @prisma/client.
 */
export const Role = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
} as const;

export type Role = (typeof Role)[keyof typeof Role];
