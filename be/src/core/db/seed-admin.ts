import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../../env.js";
import * as schema from "./schema/index.js";

/**
 * Links an existing Supabase Auth user (created via Dashboard → Authentication
 * → Users, since we don't hold a service-role key to create one via API) to
 * the seeded "CALI" org with a given role, scope=ALL. Idempotent.
 *
 *   pnpm db:seed:admin <supabase-auth-user-id> [role-code] [email]
 *   pnpm db:seed:admin d9375b4c-1a9a-41bd-a8bf-6063eeea0ebf SUPER_ADMIN admin@ktxcali.test
 */
const [, , authUserId, roleCode = "SUPER_ADMIN", email] = process.argv;

if (!authUserId) {
  console.error("Usage: pnpm db:seed:admin <supabase-auth-user-id> [role-code] [email]");
  process.exit(1);
}
// `authUserId` is narrowed to `string` above, but TS doesn't carry that
// narrowing into the closure below — rebind it to a definite-string const.
const userId: string = authUserId;

async function main() {
  const client = postgres(env.migrateDatabaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.code, "CALI"));
  if (!org) throw new Error('Org "CALI" not found — run `pnpm db:seed` first.');

  const [role] = await db
    .select()
    .from(schema.roles)
    .where(and(eq(schema.roles.orgId, org.id), eq(schema.roles.code, roleCode)));
  if (!role) throw new Error(`Role "${roleCode}" not found for org CALI — run \`pnpm db:seed\` first.`);

  const [existingUser] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (existingUser) {
    console.log("users row already exists, updating org/status only.");
    await db
      .update(schema.users)
      .set({ orgId: org.id, status: "ACTIVE", email: email ?? existingUser.email })
      .where(eq(schema.users.id, userId));
  } else {
    await db.insert(schema.users).values({
      id: userId,
      orgId: org.id,
      email: email ?? null,
      userType: "STAFF",
      fullName: `${role.name} (seed)`,
      status: "ACTIVE",
    });
    console.log("users row created.");
  }

  const [existingAssignment] = await db
    .select()
    .from(schema.userRoleAssignments)
    .where(
      and(
        eq(schema.userRoleAssignments.userId, userId),
        eq(schema.userRoleAssignments.roleId, role.id),
      ),
    );
  if (!existingAssignment) {
    await db.insert(schema.userRoleAssignments).values({
      orgId: org.id,
      userId,
      roleId: role.id,
      scope: "ALL",
      branchIds: [],
    });
    console.log("user_role_assignments row created (scope=ALL).");
  } else {
    console.log("user_role_assignments already exists — nothing to do.");
  }

  console.log(`Done. ${userId} is now "${roleCode}" (scope=ALL) in org CALI.`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
