import type { PrismaService } from '../../prisma/prisma.service';

/**
 * `Doctor` has no direct relation to `User` — the link is the polymorphic
 * `User.userableType`/`userableId` pair — so a doctor's name has to be
 * resolved with a separate batched lookup instead of a Prisma `include`.
 */
export async function getDoctorNameMap(prisma: PrismaService, doctorIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(doctorIds));
  if (uniqueIds.length === 0) return new Map();

  const users = await prisma.user.findMany({
    where: { userableType: 'Doctor', userableId: { in: uniqueIds } },
    select: { userableId: true, firstName: true, lastName: true },
  });

  return new Map(users.map((u) => {
    const first = u.firstName.startsWith('Dr.') ? u.firstName : `Dr. ${u.firstName}`;
    return [u.userableId as string, `${first} ${u.lastName}`];
  }));
}
