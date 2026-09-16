import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../../env.js";
import { PERMISSIONS, type Permission } from "../../shared/index.js";
import * as schema from "./schema/index.js";

/**
 * Seed dữ liệu giả để phát triển/demo — KHÔNG dùng cho production.
 *
 * Chạy bằng `env.migrateDatabaseUrl` (role `postgres`, có BYPASSRLS) vì tạo
 * tổ chức/role là thao tác admin không đi qua RLS của app role — giống hệt
 * lý do `db:migrate`/`db:apply-rls` cũng dùng connection này. Xem
 * src/core/db/rls/README.md.
 *
 * Idempotent theo `code` — chạy lại nhiều lần không tạo trùng.
 *
 *   pnpm db:seed
 */

const ORG_CODE = "CALI";

/** Permission theo vai trò — rút gọn từ docs/04-roles-permissions.md §2/§4 (không transcribe đủ 129 dòng, đủ để demo). */
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [...PERMISSIONS],

  // Owner: chủ yếu view + duyệt ngoại lệ lớn — xem docs/04 §3 R1 "Owner là read-only".
  OWNER: [
    "org:view",
    "branch:view",
    "building:view",
    "floor:view",
    "room:view",
    "bed:view",
    "pricing:view",
    "pricing:approve",
    "customer:view",
    "customer:view_id_doc",
    "booking:view",
    "contract:view",
    "utility:view",
    "service:view",
    "invoice:view",
    "invoice:approve_discount",
    "payment:view",
    "deposit:view",
    "deposit:refund_approve",
    "debt:view",
    "debt:view_all_branches",
    "debt:approve_write_off",
    "cash:view",
    "expense:view",
    "expense:approve",
    "ticket:view",
    "asset:view",
    "violation:view",
    "violation:approve",
    "staff:view",
    "audit:view",
    "audit:view_all",
    "report:occupancy",
    "report:revenue",
    "report:expense",
    "report:debt",
    "report:customer",
    "report:contract",
    "report:maintenance",
    "report:asset",
    "report:cashflow",
    "report:pnl",
    "report:export",
  ],

  BRANCH_MANAGER: [
    "branch:view",
    "branch:config",
    "building:view",
    "building:create",
    "building:update",
    "floor:view",
    "floor:create",
    "floor:update",
    "room:view",
    "room:create",
    "room:update",
    "room:status_update",
    "bed:view",
    "bed:create",
    "bed:update",
    "bed:status_update",
    "bed:block",
    "pricing:view",
    "customer:view",
    "customer:create",
    "customer:update",
    "customer:view_id_doc",
    "customer:blacklist",
    "booking:view",
    "booking:create",
    "booking:update",
    "booking:assign_bed",
    "contract:view",
    "contract:create",
    "contract:approve",
    "contract:renew",
    "checkin:execute",
    "checkout:execute",
    "assignment:transfer",
    "utility:view",
    "utility:approve_reading",
    "utility:config_price",
    "service:view",
    "service:manage",
    "invoice:view",
    "invoice:generate",
    "invoice:issue",
    "invoice:discount",
    "invoice:approve_adjust",
    "payment:view",
    "payment:approve_reverse",
    "payment:reconcile",
    "deposit:view",
    "deposit:refund_approve",
    "debt:view",
    "debt:send_reminder",
    "cash:view",
    "cash:approve_variance",
    "expense:view",
    "expense:create",
    "expense:approve",
    "ticket:view",
    "ticket:assign",
    "ticket:close",
    "asset:view",
    "asset:create",
    "asset:update",
    "asset:transfer",
    "housekeeping:view",
    "rule:view",
    "rule:manage",
    "violation:view",
    "violation:approve",
    "visitor:view",
    "staff:view",
    "staff:create",
    "staff:update",
    "staff:assign_role",
    "shift:manage",
    "notification:send",
    "notification:send_broadcast",
    "report:occupancy",
    "report:revenue",
    "report:expense",
    "report:debt",
    "report:customer",
    "report:contract",
    "report:maintenance",
    "report:asset",
    "audit:view",
  ],

  RECEPTIONIST: [
    "branch:view",
    "room:view",
    "room:status_update",
    "bed:view",
    "bed:status_update",
    "customer:view",
    "customer:create",
    "customer:update",
    "customer:view_id_doc",
    "booking:view",
    "booking:create",
    "booking:update",
    "booking:cancel",
    "booking:assign_bed",
    "contract:view",
    "contract:create",
    "contract:renew",
    "contract:print",
    "checkin:execute",
    "checkout:execute",
    "assignment:transfer",
    "utility:view",
    "utility:create_reading",
    "utility:update_reading",
    "service:view",
    "subscription:create",
    "subscription:update",
    "invoice:view",
    "invoice:add_charge",
    "invoice:discount",
    "payment:view",
    "payment:create",
    "payment:allocate",
    "deposit:view",
    "deposit:hold",
    "deposit:deduct",
    "deposit:refund_request",
    "debt:view",
    "debt:send_reminder",
    "cash:open_session",
    "cash:close_session",
    "cash:view",
    "ticket:view",
    "ticket:create",
    "ticket:update",
    "violation:view",
    "violation:create",
    "visitor:view",
    "visitor:checkin",
    "visitor:checkout",
    "notification:send",
  ],

  ACCOUNTANT: [
    "branch:view",
    "customer:view",
    "invoice:view",
    "invoice:generate",
    "invoice:issue",
    "invoice:adjust",
    "invoice:add_charge",
    "invoice:discount",
    "invoice:export",
    "payment:view",
    "payment:create",
    "payment:reconcile",
    "payment:allocate",
    "deposit:view",
    "deposit:hold",
    "deposit:refund_execute",
    "debt:view",
    "debt:view_all_branches",
    "debt:write_off",
    "debt:send_reminder",
    "cash:view",
    "expense:view",
    "expense:create",
    "report:revenue",
    "report:expense",
    "report:debt",
    "report:cashflow",
    "report:pnl",
    "report:export",
    "audit:view",
    "data:import",
  ],

  TECHNICIAN: [
    "ticket:view_assigned",
    "ticket:update",
    "ticket:set_cost",
    "asset:view",
    "asset:update_condition",
    "expense:create",
  ],

  HOUSEKEEPER: [
    "housekeeping:view",
    "housekeeping:create",
    "housekeeping:complete",
    "bed:status_update",
    "room:status_update",
    "ticket:create",
  ],

  SECURITY: ["visitor:view", "visitor:checkin", "visitor:checkout", "violation:create"],

  TENANT: [
    "customer:view",
    "booking:view",
    "booking:create",
    "contract:view",
    "contract:print",
    "invoice:view",
    "payment:view",
    "deposit:view",
    "debt:view",
    "ticket:view",
    "ticket:create",
    "rule:view",
    "violation:view",
    "visitor:view",
  ],
};

async function main() {
  const client = postgres(env.migrateDatabaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  console.log(`Seeding org "${ORG_CODE}"...`);

  let [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.code, ORG_CODE));
  if (!org) {
    [org] = await db
      .insert(schema.organizations)
      .values({ code: ORG_CODE, name: "KTX Cali", status: "ACTIVE" })
      .returning();
  }
  if (!org) throw new Error("failed to seed organization");
  console.log("  org id:", org.id);

  console.log("Seeding roles...");
  for (const [code, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    const [existing] = await db
      .select()
      .from(schema.roles)
      .where(and(eq(schema.roles.orgId, org.id), eq(schema.roles.code, code)));
    if (existing) {
      await db.update(schema.roles).set({ permissions }).where(eq(schema.roles.id, existing.id));
    } else {
      await db.insert(schema.roles).values({
        orgId: org.id,
        code,
        name: ROLE_NAMES[code] ?? code,
        permissions,
        isSystem: true,
        status: "ACTIVE",
      });
    }
  }
  console.log(`  ${Object.keys(ROLE_PERMISSIONS).length} roles ready`);

  console.log("Seeding branches + property structure...");
  for (const b of BRANCH_SEEDS) {
    let [branch] = await db
      .select()
      .from(schema.branches)
      .where(and(eq(schema.branches.orgId, org.id), eq(schema.branches.code, b.code)));
    if (!branch) {
      [branch] = await db
        .insert(schema.branches)
        .values({
          orgId: org.id,
          code: b.code,
          name: b.name,
          address: { street: b.street, province: "Hồ Chí Minh" },
          genderPolicy: "MIXED",
          billingDayOfMonth: 28,
          dueDayOfMonth: 10,
          status: "ACTIVE",
        })
        .returning();
    }
    if (!branch) throw new Error(`failed to seed branch ${b.code}`);
    console.log(`  branch ${branch.code} (${branch.id})`);

    let [building] = await db
      .select()
      .from(schema.buildings)
      .where(and(eq(schema.buildings.branchId, branch.id), eq(schema.buildings.code, "A")));
    if (!building) {
      [building] = await db
        .insert(schema.buildings)
        .values({ orgId: org.id, branchId: branch.id, code: "A", name: "Tòa A", hasElevator: false, status: "ACTIVE" })
        .returning();
    }
    if (!building) throw new Error("failed to seed building");

    let [roomType] = await db
      .select()
      .from(schema.roomTypes)
      .where(and(eq(schema.roomTypes.branchId, branch.id), eq(schema.roomTypes.code, "P4-DH")));
    if (!roomType) {
      [roomType] = await db
        .insert(schema.roomTypes)
        .values({
          orgId: org.id,
          branchId: branch.id,
          code: "P4-DH",
          name: "Phòng 4 người có điều hòa",
          capacity: 4,
          basePrice: 2_000_000n,
          defaultAmenities: ["AIR_CON", "WARDROBE", "DESK"],
          status: "ACTIVE",
        })
        .returning();
    }
    if (!roomType) throw new Error("failed to seed room type");

    for (const floorNumber of ["1", "2"]) {
      let [floor] = await db
        .select()
        .from(schema.floors)
        .where(and(eq(schema.floors.buildingId, building.id), eq(schema.floors.number, floorNumber)));
      if (!floor) {
        [floor] = await db
          .insert(schema.floors)
          .values({
            orgId: org.id,
            branchId: branch.id,
            buildingId: building.id,
            number: floorNumber,
            sortOrder: Number(floorNumber),
            name: `Tầng ${floorNumber}`,
            status: "ACTIVE",
          })
          .returning();
      }
      if (!floor) throw new Error("failed to seed floor");

      for (let roomIdx = 1; roomIdx <= 2; roomIdx += 1) {
        const roomCode = `A-${floorNumber}0${roomIdx}`;
        let [room] = await db
          .select()
          .from(schema.rooms)
          .where(and(eq(schema.rooms.branchId, branch.id), eq(schema.rooms.code, roomCode)));
        if (!room) {
          [room] = await db
            .insert(schema.rooms)
            .values({
              orgId: org.id,
              branchId: branch.id,
              buildingId: building.id,
              floorId: floor.id,
              code: roomCode,
              roomTypeId: roomType.id,
              capacity: 4,
              hasPrivateToilet: roomIdx === 1,
              amenities: ["AIR_CON", "WARDROBE"],
              status: "ACTIVE",
            })
            .returning();
        }
        if (!room) throw new Error("failed to seed room");

        const existingBeds = await db.select().from(schema.beds).where(eq(schema.beds.roomId, room.id));
        if (existingBeds.length === 0) {
          const bedValues = Array.from({ length: 4 }, (_, i) => ({
            orgId: org!.id,
            branchId: branch!.id,
            buildingId: building!.id,
            floorId: floor!.id,
            roomId: room!.id,
            code: `${roomCode}-B${i + 1}`,
            bedType: i < 2 ? ("BUNK_LOWER" as const) : ("BUNK_UPPER" as const),
            status: "AVAILABLE" as const,
          }));
          await db.insert(schema.beds).values(bedValues);
          await db
            .update(schema.rooms)
            .set({ actualBedCount: 4 })
            .where(eq(schema.rooms.id, room.id));
        }
      }
    }
  }

  console.log("Seed complete.");
  await client.end();
}

const ROLE_NAMES: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  OWNER: "Chủ doanh nghiệp",
  BRANCH_MANAGER: "Quản lý chi nhánh",
  RECEPTIONIST: "Lễ tân",
  ACCOUNTANT: "Kế toán",
  TECHNICIAN: "Kỹ thuật",
  HOUSEKEEPER: "Tạp vụ",
  SECURITY: "Bảo vệ",
  TENANT: "Khách thuê",
};

const BRANCH_SEEDS = [
  { code: "TD", name: "Cali Thủ Đức", street: "12 Võ Văn Ngân" },
  { code: "BT", name: "Cali Bình Thạnh", street: "45 Điện Biên Phủ" },
];

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
