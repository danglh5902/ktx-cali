import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../../env.js";
import { customerRepository } from "../../modules/customers/customer.repository.js";
import { bookingRepository } from "../../modules/bookings/booking.repository.js";
import { contractRepository, type ContractRow } from "../../modules/contracts/contract.repository.js";
import { bedAssignmentRepository } from "../../modules/contracts/bed-assignment.repository.js";
import { bedRepository } from "../../modules/beds/bed.repository.js";
import { depositLedgerRepository } from "../../modules/deposits/deposit-ledger.repository.js";
import { billingPeriodRepository } from "../../modules/billing/billing-period.repository.js";
import { invoiceRepository } from "../../modules/billing/invoice.repository.js";
import { paymentRepository } from "../../modules/payments/payment.repository.js";
import { cashSessionRepository } from "../../modules/cash-sessions/cash-session.repository.js";
import { generateDocNo, generateSimpleNo } from "./document-number.js";
import * as schema from "./schema/index.js";

/**
 * Mở rộng seed-demo.ts với thêm nhiều khách/hợp đồng/hóa đơn để "sơ đồ
 * giường", danh sách khách, công nợ... nhìn trực quan hơn khi demo UI (thay
 * vì chỉ 6 khách như seed-demo.ts). Chạy SAU seed.ts và seed-demo.ts.
 *
 *   pnpm db:seed:demo-extra
 */

const ORG_CODE = "CALI";
const RENT = 2_000_000n;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

type DemoDb = ReturnType<typeof drizzle<typeof schema>>;

interface Ctx {
  db: DemoDb;
  orgId: string;
  branchId: string;
  branchCode: string;
  actorId: string;
}

async function findCustomerByCode(ctx: Ctx, code: string) {
  const [row] = await ctx.db.select().from(schema.customers).where(eq(schema.customers.customerCode, code));
  return row ?? null;
}

async function bedByCode(ctx: Ctx, code: string) {
  const [bed] = await ctx.db
    .select()
    .from(schema.beds)
    .where(and(eq(schema.beds.branchId, ctx.branchId), eq(schema.beds.code, code)));
  if (!bed) throw new Error(`bed "${code}" not found`);
  return bed;
}

interface CustomerSpec {
  code: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  phone: string;
  occupation?: "STUDENT" | "EMPLOYEE";
  school?: string;
  company?: string;
}

async function ensureCustomer(ctx: Ctx, spec: CustomerSpec) {
  const existing = await findCustomerByCode(ctx, spec.code);
  if (existing) return existing;
  return ctx.db.transaction((tx) =>
    customerRepository.create(
      tx,
      ctx.orgId,
      spec.code,
      ctx.branchId,
      {
        branchId: ctx.branchId,
        fullName: spec.fullName,
        gender: spec.gender,
        phone: spec.phone,
        emergencyContact: { name: `Người thân của ${spec.fullName}`, phone: "0900" + spec.phone.slice(-6) },
        occupation: spec.occupation,
        school: spec.school,
        company: spec.company,
      },
      ctx.actorId,
    ),
  );
}

/** Lập hợp đồng + check-in ngay (mở bed_assignment, chiếm giường, tạo cọc EXECUTED). */
async function createActiveContract(
  ctx: Ctx,
  opts: { customerId: string; bedCode: string; startDate: Date; durationMonths?: number },
): Promise<ContractRow> {
  const bed = await bedByCode(ctx, opts.bedCode);
  const durationMonths = opts.durationMonths ?? 12;

  const contract = await ctx.db.transaction(async (tx) => {
    const contractNo = await generateDocNo(tx, { docType: "HD", branchCode: ctx.branchCode });
    return contractRepository.create(
      tx,
      ctx.orgId,
      contractNo,
      {
        branchId: ctx.branchId,
        customerId: opts.customerId,
        bedIds: [bed.id],
        startDate: isoDate(opts.startDate),
        endDate: isoDate(addMonths(opts.startDate, durationMonths)),
        durationMonths,
        monthlyRent: RENT.toString(),
        depositAmount: RENT.toString(),
        depositMonths: 1,
        billingCycle: "MONTHLY",
        termsSnapshot: "Hợp đồng thuê giường theo bảng giá niêm yết của chi nhánh.",
      },
      ctx.actorId,
    );
  });

  await ctx.db.transaction(async (tx) => {
    const assignment = await bedAssignmentRepository.create(tx, {
      orgId: ctx.orgId,
      branchId: ctx.branchId,
      contractId: contract.id,
      customerId: opts.customerId,
      bedId: bed.id,
      roomId: bed.roomId,
      floorId: bed.floorId,
      buildingId: bed.buildingId,
      startDate: isoDate(opts.startDate),
      reason: "CHECK_IN",
      dailyRate: RENT / 30n,
      monthlyRate: RENT,
      createdBy: ctx.actorId,
    });
    await bedRepository.attachAssignment(tx, bed.id, "OCCUPIED", assignment.id, ctx.actorId);
    await customerRepository.setCurrentAssignment(tx, opts.customerId, {
      status: "ACTIVE",
      currentBranchId: ctx.branchId,
      currentBedId: bed.id,
      currentContractId: contract.id,
    });
    await contractRepository.updateStatus(tx, contract.id, "ACTIVE");
    const entryNo = await generateSimpleNo(tx, { docType: "COC" });
    await depositLedgerRepository.addEntry(tx, {
      orgId: ctx.orgId,
      branchId: ctx.branchId,
      contractId: contract.id,
      customerId: opts.customerId,
      entryNo,
      entryType: "HOLD",
      amount: RENT,
      reason: "Tiền cọc nhận khi check-in",
      status: "EXECUTED",
      executedBy: ctx.actorId,
    });
  });

  return contract;
}

/** Sinh 1 kỳ + 1 hóa đơn đã phát hành cho hợp đồng, tùy chọn ghi nhận thanh toán một phần/toàn phần. */
async function issueInvoiceForPeriod(
  ctx: Ctx,
  opts: { contract: ContractRow; periodStart: Date; periodCode: string; paidAmount?: bigint; payerName: string },
): Promise<void> {
  const periodTo = addMonths(opts.periodStart, 1);
  const dueDate = addDays(opts.periodStart, 10);

  const invoice = await ctx.db.transaction(async (tx) => {
    const period = await billingPeriodRepository.create(
      tx,
      ctx.orgId,
      {
        branchId: ctx.branchId,
        code: opts.periodCode,
        periodFrom: isoDate(opts.periodStart),
        periodTo: isoDate(periodTo),
        dueDate: isoDate(dueDate),
      },
      ctx.actorId,
    );
    const invoiceNo = await generateDocNo(tx, { docType: "INV", branchCode: ctx.branchCode });
    const inv = await invoiceRepository.create(tx, {
      orgId: ctx.orgId,
      branchId: ctx.branchId,
      invoiceNo,
      contractId: opts.contract.id,
      customerId: opts.contract.customerId,
      billingPeriodId: period.id,
      periodFrom: period.periodFrom,
      periodTo: period.periodTo,
      dueDate: period.dueDate ?? undefined,
      subtotal: RENT,
      grandTotal: RENT,
      lines: [{ lineType: "RENT", description: `Tiền phòng kỳ ${opts.periodCode}`, amount: RENT, unitPrice: RENT }],
    });
    await invoiceRepository.issue(tx, inv.id, ctx.actorId);
    await billingPeriodRepository.markGenerated(tx, period.id, { invoiceCount: 1, totalAmount: RENT, generatedBy: ctx.actorId });
    return inv;
  });

  const paidAmount = opts.paidAmount ?? 0n;
  if (paidAmount > 0n) {
    await ctx.db.transaction(async (tx) => {
      const paymentNo = await generateSimpleNo(tx, { docType: "PT" });
      const payment = await paymentRepository.create(tx, {
        orgId: ctx.orgId,
        branchId: ctx.branchId,
        paymentNo,
        customerId: opts.contract.customerId,
        payerName: opts.payerName,
        amount: paidAmount,
        method: "CASH",
        receivedBy: ctx.actorId,
      });
      await paymentRepository.addAllocation(tx, {
        orgId: ctx.orgId,
        branchId: ctx.branchId,
        paymentId: payment.id,
        invoiceId: invoice.id,
        amount: paidAmount,
        allocatedBy: ctx.actorId,
      });
      await paymentRepository.updateAllocated(tx, payment.id, paidAmount, 0n);
      await invoiceRepository.applyPayment(tx, invoice.id, paidAmount, RENT - paidAmount);
    });
  }
}

async function main() {
  const client = postgres(env.migrateDatabaseUrl, { max: 1 });
  const db = drizzle(client, { schema });
  const now = new Date();

  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.code, ORG_CODE));
  if (!org) throw new Error(`org "${ORG_CODE}" not found — run "pnpm db:seed" first`);

  const [branchTD] = await db.select().from(schema.branches).where(and(eq(schema.branches.orgId, org.id), eq(schema.branches.code, "TD")));
  const [branchBT] = await db.select().from(schema.branches).where(and(eq(schema.branches.orgId, org.id), eq(schema.branches.code, "BT")));
  if (!branchTD || !branchBT) throw new Error('branches "TD"/"BT" not found — run "pnpm db:seed" first');

  const [adminUser] = await db.select().from(schema.users).where(eq(schema.users.orgId, org.id));
  if (!adminUser) throw new Error('no admin user found — run "pnpm db:seed:admin" first');

  const td: Ctx = { db, orgId: org.id, branchId: branchTD.id, branchCode: branchTD.code, actorId: adminUser.id };
  const bt: Ctx = { db, orgId: org.id, branchId: branchBT.id, branchCode: branchBT.code, actorId: adminUser.id };

  console.log("Seeding thêm dữ liệu demo (khách/hợp đồng/hóa đơn) để trực quan hơn trên UI...");

  // ---- TD: 4 khách ACTIVE mới, đa dạng tình trạng thanh toán ----
  if (!(await findCustomerByCode(td, "KH-DEMO-007"))) {
    const c = await ensureCustomer(td, { code: "KH-DEMO-007", fullName: "Đỗ Minh Khôi", gender: "MALE", phone: "0902000007", occupation: "STUDENT", school: "Đại học Bách Khoa TP.HCM" });
    const start = addMonths(now, -3);
    const contract = await createActiveContract(td, { customerId: c.id, bedCode: "A-101-B3", startDate: start });
    await issueInvoiceForPeriod(td, { contract, periodStart: start, periodCode: `TD-KH007-K1`, paidAmount: RENT, payerName: c.fullName });
    await issueInvoiceForPeriod(td, { contract, periodStart: addMonths(start, 1), periodCode: `TD-KH007-K2`, paidAmount: RENT, payerName: c.fullName });
    await issueInvoiceForPeriod(td, { contract, periodStart: addMonths(start, 2), periodCode: `TD-KH007-K3`, paidAmount: 1_000_000n, payerName: c.fullName });
    console.log("  KH-DEMO-007 (Đỗ Minh Khôi) — ACTIVE, 3 kỳ hóa đơn, còn nợ 1,000,000đ");
  }

  if (!(await findCustomerByCode(td, "KH-DEMO-008"))) {
    const c = await ensureCustomer(td, { code: "KH-DEMO-008", fullName: "Ngô Thị Hà", gender: "FEMALE", phone: "0902000008", occupation: "EMPLOYEE", company: "Công ty TNHH Hà Nội Sun" });
    const start = addMonths(now, -1);
    const contract = await createActiveContract(td, { customerId: c.id, bedCode: "A-101-B4", startDate: start });
    await issueInvoiceForPeriod(td, { contract, periodStart: start, periodCode: `TD-KH008-K1`, payerName: c.fullName });
    console.log("  KH-DEMO-008 (Ngô Thị Hà) — ACTIVE, hóa đơn mới phát hành, chưa tới hạn");
  }

  if (!(await findCustomerByCode(td, "KH-DEMO-009"))) {
    const c = await ensureCustomer(td, { code: "KH-DEMO-009", fullName: "Bùi Văn Long", gender: "MALE", phone: "0902000009", occupation: "STUDENT", school: "Đại học Kinh tế TP.HCM" });
    const start = addMonths(now, -11);
    const contract = await createActiveContract(td, { customerId: c.id, bedCode: "A-102-B3", startDate: start, durationMonths: 12 });
    await db.transaction((tx) => contractRepository.updateStatus(tx, contract.id, "EXPIRING"));
    await issueInvoiceForPeriod(td, { contract, periodStart: addMonths(now, -1), periodCode: `TD-KH009-K1`, paidAmount: RENT, payerName: c.fullName });
    console.log("  KH-DEMO-009 (Bùi Văn Long) — sắp hết hạn hợp đồng (EXPIRING)");
  }

  if (!(await findCustomerByCode(td, "KH-DEMO-010"))) {
    const c = await ensureCustomer(td, { code: "KH-DEMO-010", fullName: "Vương Thị Mai", gender: "FEMALE", phone: "0902000010", occupation: "STUDENT", school: "Đại học Y Dược TP.HCM" });
    const start = addMonths(now, -2);
    const contract = await createActiveContract(td, { customerId: c.id, bedCode: "A-102-B4", startDate: start });
    await issueInvoiceForPeriod(td, { contract, periodStart: start, periodCode: `TD-KH010-K1`, paidAmount: RENT, payerName: c.fullName });
    console.log("  KH-DEMO-010 (Vương Thị Mai) — ACTIVE, sạch nợ");
  }

  // ---- TD: check-out sạch (đối chiếu với KH-DEMO-003 còn nợ + chờ hoàn cọc) ----
  if (!(await findCustomerByCode(td, "KH-DEMO-011"))) {
    const c = await ensureCustomer(td, { code: "KH-DEMO-011", fullName: "Trịnh Văn Nam", gender: "MALE", phone: "0902000011", occupation: "EMPLOYEE", company: "Công ty CP Nam Việt" });
    const start = addMonths(now, -8);
    const checkOutDate = addDays(now, -5);
    const contract = await createActiveContract(td, { customerId: c.id, bedCode: "A-201-B1", startDate: start });
    await issueInvoiceForPeriod(td, { contract, periodStart: start, periodCode: `TD-KH011-K1`, paidAmount: RENT, payerName: c.fullName });

    await db.transaction(async (tx) => {
      const openAssignments = await bedAssignmentRepository.findOpenByContractId(tx, contract.id);
      for (const a of openAssignments) {
        await bedAssignmentRepository.close(tx, a.id, isoDate(checkOutDate));
        await bedRepository.attachAssignment(tx, a.bedId, "CLEANING", null, td.actorId);
      }
      await customerRepository.setCurrentAssignment(tx, c.id, { status: "CHECKED_OUT", currentBedId: null, currentContractId: null });
      await contractRepository.updateStatus(tx, contract.id, "TERMINATED", {
        terminatedAt: checkOutDate,
        terminationType: "MUTUAL",
        terminationReason: "Hết hạn hợp đồng, không gia hạn",
      });
      const refundEntryNo = await generateSimpleNo(tx, { docType: "HC" });
      await depositLedgerRepository.addEntry(tx, {
        orgId: td.orgId,
        branchId: td.branchId,
        contractId: contract.id,
        customerId: c.id,
        entryNo: refundEntryNo,
        entryType: "REFUND",
        amount: -RENT,
        reason: "Hoàn cọc đầy đủ — phòng bàn giao sạch sẽ",
        status: "EXECUTED",
        requestedBy: td.actorId,
        approvedBy: td.actorId,
        executedBy: td.actorId,
      });
    });
    console.log("  KH-DEMO-011 (Trịnh Văn Nam) — CHECKED_OUT sạch, đã hoàn cọc đầy đủ");
  }

  // ---- TD: thêm 1 khách tiềm năng đang giữ chỗ ----
  if (!(await findCustomerByCode(td, "KH-DEMO-012"))) {
    const c = await ensureCustomer(td, { code: "KH-DEMO-012", fullName: "Lý Thị Oanh", gender: "FEMALE", phone: "0902000012", occupation: "STUDENT", school: "Đại học Ngoại thương CS2" });
    const bed = await bedByCode(td, "A-201-B2");
    await db.transaction(async (tx) => {
      const bookingNo = await generateDocNo(tx, { docType: "DC", branchCode: td.branchCode });
      await bookingRepository.create(
        tx,
        td.orgId,
        bookingNo,
        {
          branchId: td.branchId,
          customerId: c.id,
          bedId: bed.id,
          expectedCheckInDate: isoDate(addDays(now, 5)),
          expectedDurationMonths: 12,
          quotedPrice: RENT.toString(),
          depositRequired: RENT.toString(),
          holdHours: 72,
          source: "WEBSITE",
        },
        addDays(now, 3),
        td.actorId,
      );
    });
    console.log("  KH-DEMO-012 (Lý Thị Oanh) — PROSPECT, đang giữ giường A-201-B2");
  }

  // ---- BT: 3 khách ACTIVE mới ----
  if (!(await findCustomerByCode(bt, "KH-DEMO-013"))) {
    const c = await ensureCustomer(bt, { code: "KH-DEMO-013", fullName: "Phan Văn Phúc", gender: "MALE", phone: "0902000013", occupation: "EMPLOYEE", company: "Công ty TNHH Phúc Thành" });
    const start = addDays(now, -45);
    const contract = await createActiveContract(bt, { customerId: c.id, bedCode: "A-101-B2", startDate: start });
    await issueInvoiceForPeriod(bt, { contract, periodStart: start, periodCode: `BT-KH013-K1`, payerName: c.fullName });
    console.log("  KH-DEMO-013 (Phan Văn Phúc) — ACTIVE, hóa đơn quá hạn chưa trả");
  }

  if (!(await findCustomerByCode(bt, "KH-DEMO-014"))) {
    const c = await ensureCustomer(bt, { code: "KH-DEMO-014", fullName: "Đặng Thị Quỳnh", gender: "FEMALE", phone: "0902000014", occupation: "STUDENT", school: "Đại học Hoa Sen" });
    const start = addMonths(now, -1);
    const contract = await createActiveContract(bt, { customerId: c.id, bedCode: "A-101-B3", startDate: start });
    await issueInvoiceForPeriod(bt, { contract, periodStart: start, periodCode: `BT-KH014-K1`, paidAmount: RENT, payerName: c.fullName });
    console.log("  KH-DEMO-014 (Đặng Thị Quỳnh) — ACTIVE, sạch nợ");
  }

  if (!(await findCustomerByCode(bt, "KH-DEMO-015"))) {
    const c = await ensureCustomer(bt, { code: "KH-DEMO-015", fullName: "Hồ Văn Sơn", gender: "MALE", phone: "0902000015", occupation: "EMPLOYEE", company: "Công ty CP Sơn Hà" });
    const start = addMonths(now, -2);
    const contract = await createActiveContract(bt, { customerId: c.id, bedCode: "A-102-B1", startDate: start });
    await issueInvoiceForPeriod(bt, { contract, periodStart: start, periodCode: `BT-KH015-K1`, paidAmount: RENT, payerName: c.fullName });
    await issueInvoiceForPeriod(bt, { contract, periodStart: addMonths(start, 1), periodCode: `BT-KH015-K2`, paidAmount: 500_000n, payerName: c.fullName });
    console.log("  KH-DEMO-015 (Hồ Văn Sơn) — ACTIVE, còn nợ 1,500,000đ kỳ gần nhất");
  }

  // ---- BT: check-out còn nợ + yêu cầu hoàn cọc đã duyệt (chưa chi) ----
  if (!(await findCustomerByCode(bt, "KH-DEMO-016"))) {
    const c = await ensureCustomer(bt, { code: "KH-DEMO-016", fullName: "Mai Thị Trang", gender: "FEMALE", phone: "0902000016", occupation: "STUDENT", school: "Đại học Văn Lang" });
    const start = addMonths(now, -5);
    const checkOutDate = addDays(now, -2);
    const contract = await createActiveContract(bt, { customerId: c.id, bedCode: "A-102-B2", startDate: start });
    await issueInvoiceForPeriod(bt, { contract, periodStart: addMonths(now, -1), periodCode: `BT-KH016-K1`, payerName: c.fullName });

    await db.transaction(async (tx) => {
      const openAssignments = await bedAssignmentRepository.findOpenByContractId(tx, contract.id);
      for (const a of openAssignments) {
        await bedAssignmentRepository.close(tx, a.id, isoDate(checkOutDate));
        await bedRepository.attachAssignment(tx, a.bedId, "CLEANING", null, bt.actorId);
      }
      await customerRepository.setCurrentAssignment(tx, c.id, { status: "CHECKED_OUT_WITH_DEBT", currentBedId: null, currentContractId: null });
      await contractRepository.updateStatus(tx, contract.id, "TERMINATED", {
        terminatedAt: checkOutDate,
        terminationType: "BY_TENANT",
        terminationReason: "Chuyển việc sang thành phố khác",
      });
      const refundEntryNo = await generateSimpleNo(tx, { docType: "HC" });
      const entry = await depositLedgerRepository.addEntry(tx, {
        orgId: bt.orgId,
        branchId: bt.branchId,
        contractId: contract.id,
        customerId: c.id,
        entryNo: refundEntryNo,
        entryType: "REFUND",
        amount: -RENT,
        reason: "Hoàn cọc — đã trừ tiền dọn phòng, còn nợ hóa đơn kỳ cuối chưa thu",
        status: "PENDING",
        requestedBy: bt.actorId,
      });
      await depositLedgerRepository.updateStatus(tx, entry.id, "APPROVED", { approvedBy: bt.actorId });
    });
    console.log("  KH-DEMO-016 (Mai Thị Trang) — CHECKED_OUT_WITH_DEBT, hoàn cọc đã duyệt chờ chi");
  }

  // ---- BT: 1 khách blacklist thêm, 1 khách đang giữ chỗ ----
  if (!(await findCustomerByCode(bt, "KH-DEMO-017"))) {
    const c = await ensureCustomer(bt, { code: "KH-DEMO-017", fullName: "Đinh Văn Uy", gender: "MALE", phone: "0902000017" });
    await db.transaction((tx) => customerRepository.setBlacklisted(tx, c.id, "Gây gổ đánh nhau với khách cùng phòng, vi phạm nội quy nghiêm trọng", bt.actorId));
    console.log("  KH-DEMO-017 (Đinh Văn Uy) — BLACKLISTED");
  }

  if (!(await findCustomerByCode(bt, "KH-DEMO-018"))) {
    const c = await ensureCustomer(bt, { code: "KH-DEMO-018", fullName: "Cao Thị Vân", gender: "FEMALE", phone: "0902000018", occupation: "STUDENT", school: "Đại học Công nghệ TP.HCM" });
    const bed = await bedByCode(bt, "A-201-B1");
    await db.transaction(async (tx) => {
      const bookingNo = await generateDocNo(tx, { docType: "DC", branchCode: bt.branchCode });
      await bookingRepository.create(
        tx,
        bt.orgId,
        bookingNo,
        {
          branchId: bt.branchId,
          customerId: c.id,
          bedId: bed.id,
          expectedCheckInDate: isoDate(addDays(now, 7)),
          expectedDurationMonths: 6,
          quotedPrice: RENT.toString(),
          depositRequired: RENT.toString(),
          holdHours: 48,
          source: "REFERRAL",
        },
        addDays(now, 2),
        bt.actorId,
      );
    });
    console.log("  KH-DEMO-018 (Cao Thị Vân) — PROSPECT, đang giữ giường A-201-B1 (BT)");
  }

  // ---- Thêm lịch sử ca quỹ TD đã đóng (khớp sổ, không lệch) ----
  const existingHistoryTD = await db
    .select()
    .from(schema.cashSessions)
    .where(and(eq(schema.cashSessions.branchId, td.branchId), eq(schema.cashSessions.sessionNo, "CA-HISTORY-TD-1")));
  if (existingHistoryTD.length === 0) {
    await db.transaction(async (tx) => {
      const openedAt = addDays(now, -2);
      const [session] = await tx
        .insert(schema.cashSessions)
        .values({
          orgId: td.orgId,
          branchId: td.branchId,
          sessionNo: "CA-HISTORY-TD-1",
          staffId: td.actorId,
          openedAt,
          openingBalance: 300_000n,
          status: "OPEN",
        })
        .returning();
      if (!session) throw new Error("failed to seed TD cash session history");
      await cashSessionRepository.close(tx, session.id, { systemTotal: 300_000n, countedTotal: 300_000n, variance: 0n });
    });
    console.log("  Ca quỹ TD lịch sử — đã đóng, khớp sổ (không lệch)");
  }

  console.log("Seed demo-extra complete.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
