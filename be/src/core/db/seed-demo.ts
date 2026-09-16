import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../../env.js";
import { customerRepository } from "../../modules/customers/customer.repository.js";
import { bookingRepository } from "../../modules/bookings/booking.repository.js";
import { contractRepository } from "../../modules/contracts/contract.repository.js";
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
 * Seed dữ liệu demo cho vòng đời khách thuê + tiền (docs/18 Phase 1 MVP):
 * khách thuê, đặt chỗ, hợp đồng, check-in/out, hóa đơn, thanh toán, cọc, ca
 * quỹ — đủ để đi demo trực tiếp trên UI. Chạy SAU `db:seed` (cần org/chi
 * nhánh/phòng/giường có sẵn).
 *
 * Dùng `env.migrateDatabaseUrl` (role `postgres`, bypass RLS) như seed.ts,
 * nhưng gọi thẳng các repository thật (không qua service/withRequestContext)
 * để tái dùng đúng logic sinh mã chứng từ + bất biến nghiệp vụ (1 assignment
 * mở/giường, balanceAfter sổ cọc...) mà không cần RLS session vì đây là job
 * hệ thống, không phải request người dùng — xem core/db/transaction.ts.
 *
 * Idempotent theo customerCode — chạy lại nhiều lần không tạo trùng khách.
 *
 *   pnpm db:seed:demo
 */

const ORG_CODE = "CALI";

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

async function main() {
  const client = postgres(env.migrateDatabaseUrl, { max: 1 });
  const db = drizzle(client, { schema });
  const now = new Date();

  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.code, ORG_CODE));
  if (!org) throw new Error(`org "${ORG_CODE}" not found — run "pnpm db:seed" first`);

  const [branchTD] = await db
    .select()
    .from(schema.branches)
    .where(and(eq(schema.branches.orgId, org.id), eq(schema.branches.code, "TD")));
  const [branchBT] = await db
    .select()
    .from(schema.branches)
    .where(and(eq(schema.branches.orgId, org.id), eq(schema.branches.code, "BT")));
  if (!branchTD || !branchBT) throw new Error('branches "TD"/"BT" not found — run "pnpm db:seed" first');

  const [adminUser] = await db.select().from(schema.users).where(eq(schema.users.orgId, org.id));
  const actorId = adminUser?.id;
  if (!actorId) throw new Error('no admin user found — run "pnpm db:seed:admin" first');

  async function bedByCode(branchId: string, code: string) {
    const [bed] = await db
      .select()
      .from(schema.beds)
      .where(and(eq(schema.beds.branchId, branchId), eq(schema.beds.code, code)));
    if (!bed) throw new Error(`bed "${code}" not found in branch ${branchId}`);
    return bed;
  }

  async function findCustomerByCode(code: string) {
    const [row] = await db.select().from(schema.customers).where(eq(schema.customers.customerCode, code));
    return row ?? null;
  }

  console.log("Seeding demo customers/bookings/contracts/finance...");

  // ---- KH1: TD, ACTIVE, 2 kỳ hóa đơn — kỳ 1 đã trả đủ, kỳ 2 trả một phần (demo công nợ) ----
  const existing1 = await findCustomerByCode("KH-DEMO-001");
  if (!existing1) {
    const bedTD1 = await bedByCode(branchTD.id, "A-101-B1");

    const customer1 = await db.transaction((tx) =>
      customerRepository.create(
        tx,
        org.id,
        "KH-DEMO-001",
        branchTD.id,
        {
          branchId: branchTD.id,
          fullName: "Nguyễn Văn An",
          gender: "MALE",
          phone: "0901000001",
          idType: "CCCD",
          idNumber: "079099000001",
          emergencyContact: { name: "Nguyễn Văn Bố", relationship: "Cha", phone: "0909000001" },
          occupation: "STUDENT",
          school: "Đại học Sư phạm Kỹ thuật TP.HCM",
          source: "WALK_IN",
        },
        actorId,
      ),
    );

    const startDate = addMonths(now, -2);
    const contract1 = await db.transaction(async (tx) => {
      const contractNo = await generateDocNo(tx, { docType: "HD", branchCode: branchTD.code });
      return contractRepository.create(
        tx,
        org.id,
        contractNo,
        {
          branchId: branchTD.id,
          customerId: customer1.id,
          bedIds: [bedTD1.id],
          startDate: isoDate(startDate),
          endDate: isoDate(addMonths(startDate, 12)),
          durationMonths: 12,
          monthlyRent: "2000000",
          depositAmount: "2000000",
          depositMonths: 1,
          billingCycle: "MONTHLY",
          termsSnapshot: "Hợp đồng thuê giường theo bảng giá niêm yết — bản demo.",
        },
        actorId,
      );
    });

    await db.transaction(async (tx) => {
      const assignment = await bedAssignmentRepository.create(tx, {
        orgId: org.id,
        branchId: branchTD.id,
        contractId: contract1.id,
        customerId: customer1.id,
        bedId: bedTD1.id,
        roomId: bedTD1.roomId,
        floorId: bedTD1.floorId,
        buildingId: bedTD1.buildingId,
        startDate: isoDate(startDate),
        reason: "CHECK_IN",
        dailyRate: 2_000_000n / 30n,
        monthlyRate: 2_000_000n,
        createdBy: actorId,
      });
      await bedRepository.attachAssignment(tx, bedTD1.id, "OCCUPIED", assignment.id, actorId);
      await customerRepository.setCurrentAssignment(tx, customer1.id, {
        status: "ACTIVE",
        currentBranchId: branchTD.id,
        currentBedId: bedTD1.id,
        currentContractId: contract1.id,
      });
      await contractRepository.updateStatus(tx, contract1.id, "ACTIVE");

      const entryNo = await generateSimpleNo(tx, { docType: "COC" });
      await depositLedgerRepository.addEntry(tx, {
        orgId: org.id,
        branchId: branchTD.id,
        contractId: contract1.id,
        customerId: customer1.id,
        entryNo,
        entryType: "HOLD",
        amount: 2_000_000n,
        reason: "Tiền cọc nhận khi check-in",
        status: "EXECUTED",
        executedBy: actorId,
      });
    });

    // Kỳ 1: đã phát hành + trả đủ.
    const period1 = await db.transaction(async (tx) => {
      const p = await billingPeriodRepository.create(
        tx,
        org.id,
        {
          branchId: branchTD.id,
          code: `TD-${isoDate(startDate).slice(0, 7)}`,
          periodFrom: isoDate(startDate),
          periodTo: isoDate(addMonths(startDate, 1)),
          dueDate: isoDate(addDays(startDate, 10)),
        },
        actorId,
      );
      const invoiceNo = await generateDocNo(tx, { docType: "INV", branchCode: branchTD.code });
      const invoice = await invoiceRepository.create(tx, {
        orgId: org.id,
        branchId: branchTD.id,
        invoiceNo,
        contractId: contract1.id,
        customerId: customer1.id,
        billingPeriodId: p.id,
        periodFrom: p.periodFrom,
        periodTo: p.periodTo,
        dueDate: p.dueDate ?? undefined,
        subtotal: 2_000_000n,
        grandTotal: 2_000_000n,
        lines: [{ lineType: "RENT", description: "Tiền phòng kỳ 1", amount: 2_000_000n, unitPrice: 2_000_000n }],
      });
      await invoiceRepository.issue(tx, invoice.id, actorId);
      await billingPeriodRepository.markGenerated(tx, p.id, { invoiceCount: 1, totalAmount: 2_000_000n, generatedBy: actorId });
      return { period: p, invoice };
    });

    await db.transaction(async (tx) => {
      const paymentNo = await generateSimpleNo(tx, { docType: "PT" });
      const payment = await paymentRepository.create(tx, {
        orgId: org.id,
        branchId: branchTD.id,
        paymentNo,
        customerId: customer1.id,
        payerName: "Nguyễn Văn An",
        amount: 2_000_000n,
        method: "CASH",
        receivedBy: actorId,
      });
      await paymentRepository.addAllocation(tx, {
        orgId: org.id,
        branchId: branchTD.id,
        paymentId: payment.id,
        invoiceId: period1.invoice.id,
        amount: 2_000_000n,
        allocatedBy: actorId,
      });
      await paymentRepository.updateAllocated(tx, payment.id, 2_000_000n, 0n);
      await invoiceRepository.applyPayment(tx, period1.invoice.id, 2_000_000n, 0n);
    });

    // Kỳ 2: đã phát hành, khách mới trả một phần — còn nợ để demo công nợ/aging.
    const period2Start = addMonths(startDate, 1);
    const period2 = await db.transaction(async (tx) => {
      const p = await billingPeriodRepository.create(
        tx,
        org.id,
        {
          branchId: branchTD.id,
          code: `TD-${isoDate(period2Start).slice(0, 7)}`,
          periodFrom: isoDate(period2Start),
          periodTo: isoDate(addMonths(period2Start, 1)),
          dueDate: isoDate(addDays(period2Start, 10)),
        },
        actorId,
      );
      const invoiceNo = await generateDocNo(tx, { docType: "INV", branchCode: branchTD.code });
      const invoice = await invoiceRepository.create(tx, {
        orgId: org.id,
        branchId: branchTD.id,
        invoiceNo,
        contractId: contract1.id,
        customerId: customer1.id,
        billingPeriodId: p.id,
        periodFrom: p.periodFrom,
        periodTo: p.periodTo,
        dueDate: p.dueDate ?? undefined,
        subtotal: 2_000_000n,
        grandTotal: 2_000_000n,
        lines: [{ lineType: "RENT", description: "Tiền phòng kỳ 2", amount: 2_000_000n, unitPrice: 2_000_000n }],
      });
      await invoiceRepository.issue(tx, invoice.id, actorId);
      await billingPeriodRepository.markGenerated(tx, p.id, { invoiceCount: 1, totalAmount: 2_000_000n, generatedBy: actorId });
      return { period: p, invoice };
    });

    await db.transaction(async (tx) => {
      const paymentNo = await generateSimpleNo(tx, { docType: "PT" });
      const payment = await paymentRepository.create(tx, {
        orgId: org.id,
        branchId: branchTD.id,
        paymentNo,
        customerId: customer1.id,
        payerName: "Nguyễn Văn An",
        amount: 800_000n,
        method: "BANK_TRANSFER",
        receivedBy: actorId,
      });
      await paymentRepository.addAllocation(tx, {
        orgId: org.id,
        branchId: branchTD.id,
        paymentId: payment.id,
        invoiceId: period2.invoice.id,
        amount: 800_000n,
        allocatedBy: actorId,
      });
      await paymentRepository.updateAllocated(tx, payment.id, 800_000n, 0n);
      await invoiceRepository.applyPayment(tx, period2.invoice.id, 800_000n, 1_200_000n);
    });

    console.log("  KH-DEMO-001 (Nguyễn Văn An) — ACTIVE, còn nợ 1,200,000đ kỳ 2");
  }

  // ---- KH2: TD, ACTIVE, hóa đơn kỳ đầu quá hạn chưa trả (demo overdue) ----
  const existing2 = await findCustomerByCode("KH-DEMO-002");
  if (!existing2) {
    const bedTD2 = await bedByCode(branchTD.id, "A-101-B2");
    const customer2 = await db.transaction((tx) =>
      customerRepository.create(
        tx,
        org.id,
        "KH-DEMO-002",
        branchTD.id,
        {
          branchId: branchTD.id,
          fullName: "Trần Thị Bình",
          gender: "FEMALE",
          phone: "0901000002",
          emergencyContact: { name: "Trần Văn Cha", relationship: "Cha", phone: "0909000002" },
          occupation: "EMPLOYEE",
          company: "Công ty TNHH ABC",
          source: "REFERRAL",
        },
        actorId,
      ),
    );

    const startDate2 = addDays(now, -40);
    const contract2 = await db.transaction(async (tx) => {
      const contractNo = await generateDocNo(tx, { docType: "HD", branchCode: branchTD.code });
      return contractRepository.create(
        tx,
        org.id,
        contractNo,
        {
          branchId: branchTD.id,
          customerId: customer2.id,
          bedIds: [bedTD2.id],
          startDate: isoDate(startDate2),
          endDate: isoDate(addMonths(startDate2, 12)),
          durationMonths: 12,
          monthlyRent: "2000000",
          depositAmount: "2000000",
          depositMonths: 1,
          billingCycle: "MONTHLY",
          termsSnapshot: "Hợp đồng thuê giường theo bảng giá niêm yết — bản demo.",
        },
        actorId,
      );
    });

    await db.transaction(async (tx) => {
      const assignment = await bedAssignmentRepository.create(tx, {
        orgId: org.id,
        branchId: branchTD.id,
        contractId: contract2.id,
        customerId: customer2.id,
        bedId: bedTD2.id,
        roomId: bedTD2.roomId,
        floorId: bedTD2.floorId,
        buildingId: bedTD2.buildingId,
        startDate: isoDate(startDate2),
        reason: "CHECK_IN",
        dailyRate: 2_000_000n / 30n,
        monthlyRate: 2_000_000n,
        createdBy: actorId,
      });
      await bedRepository.attachAssignment(tx, bedTD2.id, "OCCUPIED", assignment.id, actorId);
      await customerRepository.setCurrentAssignment(tx, customer2.id, {
        status: "ACTIVE",
        currentBranchId: branchTD.id,
        currentBedId: bedTD2.id,
        currentContractId: contract2.id,
      });
      await contractRepository.updateStatus(tx, contract2.id, "ACTIVE");
      const entryNo = await generateSimpleNo(tx, { docType: "COC" });
      await depositLedgerRepository.addEntry(tx, {
        orgId: org.id,
        branchId: branchTD.id,
        contractId: contract2.id,
        customerId: customer2.id,
        entryNo,
        entryType: "HOLD",
        amount: 2_000_000n,
        reason: "Tiền cọc nhận khi check-in",
        status: "EXECUTED",
        executedBy: actorId,
      });

      const p = await billingPeriodRepository.create(
        tx,
        org.id,
        {
          branchId: branchTD.id,
          code: `TD-${isoDate(startDate2).slice(0, 7)}-K2`,
          periodFrom: isoDate(startDate2),
          periodTo: isoDate(addMonths(startDate2, 1)),
          dueDate: isoDate(addDays(startDate2, 10)),
        },
        actorId,
      );
      const invoiceNo = await generateDocNo(tx, { docType: "INV", branchCode: branchTD.code });
      const invoice = await invoiceRepository.create(tx, {
        orgId: org.id,
        branchId: branchTD.id,
        invoiceNo,
        contractId: contract2.id,
        customerId: customer2.id,
        billingPeriodId: p.id,
        periodFrom: p.periodFrom,
        periodTo: p.periodTo,
        dueDate: p.dueDate ?? undefined,
        subtotal: 2_000_000n,
        grandTotal: 2_000_000n,
        lines: [{ lineType: "RENT", description: "Tiền phòng kỳ đầu", amount: 2_000_000n, unitPrice: 2_000_000n }],
      });
      await invoiceRepository.issue(tx, invoice.id, actorId);
      await billingPeriodRepository.markGenerated(tx, p.id, { invoiceCount: 1, totalAmount: 2_000_000n, generatedBy: actorId });
    });

    console.log("  KH-DEMO-002 (Trần Thị Bình) — ACTIVE, hóa đơn quá hạn 2,000,000đ chưa trả");
  }

  // ---- KH3: TD, CHECKED_OUT, đang chờ duyệt hoàn cọc ----
  const existing3 = await findCustomerByCode("KH-DEMO-003");
  if (!existing3) {
    const bedTD3 = await bedByCode(branchTD.id, "A-102-B1");
    const customer3 = await db.transaction((tx) =>
      customerRepository.create(
        tx,
        org.id,
        "KH-DEMO-003",
        branchTD.id,
        {
          branchId: branchTD.id,
          fullName: "Lê Văn Cường",
          gender: "MALE",
          phone: "0901000003",
          emergencyContact: { name: "Lê Thị Mẹ", relationship: "Mẹ", phone: "0909000003" },
          occupation: "STUDENT",
          school: "Đại học Tôn Đức Thắng",
        },
        actorId,
      ),
    );

    const startDate3 = addMonths(now, -6);
    const checkOutDate3 = addDays(now, -10);
    const contract3 = await db.transaction(async (tx) => {
      const contractNo = await generateDocNo(tx, { docType: "HD", branchCode: branchTD.code });
      return contractRepository.create(
        tx,
        org.id,
        contractNo,
        {
          branchId: branchTD.id,
          customerId: customer3.id,
          bedIds: [bedTD3.id],
          startDate: isoDate(startDate3),
          endDate: isoDate(addMonths(startDate3, 12)),
          durationMonths: 12,
          monthlyRent: "2000000",
          depositAmount: "2000000",
          depositMonths: 1,
          billingCycle: "MONTHLY",
          termsSnapshot: "Hợp đồng thuê giường theo bảng giá niêm yết — bản demo.",
        },
        actorId,
      );
    });

    const depositEntryNo = await db.transaction(async (tx) => {
      const assignment = await bedAssignmentRepository.create(tx, {
        orgId: org.id,
        branchId: branchTD.id,
        contractId: contract3.id,
        customerId: customer3.id,
        bedId: bedTD3.id,
        roomId: bedTD3.roomId,
        floorId: bedTD3.floorId,
        buildingId: bedTD3.buildingId,
        startDate: isoDate(startDate3),
        reason: "CHECK_IN",
        dailyRate: 2_000_000n / 30n,
        monthlyRate: 2_000_000n,
        createdBy: actorId,
      });
      await bedRepository.attachAssignment(tx, bedTD3.id, "OCCUPIED", assignment.id, actorId);
      await contractRepository.updateStatus(tx, contract3.id, "ACTIVE");
      const entryNo = await generateSimpleNo(tx, { docType: "COC" });
      await depositLedgerRepository.addEntry(tx, {
        orgId: org.id,
        branchId: branchTD.id,
        contractId: contract3.id,
        customerId: customer3.id,
        entryNo,
        entryType: "HOLD",
        amount: 2_000_000n,
        reason: "Tiền cọc nhận khi check-in",
        status: "EXECUTED",
        executedBy: actorId,
      });

      // Check-out: đóng assignment, trả giường CLEANING, chấm dứt hợp đồng.
      await bedAssignmentRepository.close(tx, assignment.id, isoDate(checkOutDate3));
      await bedRepository.attachAssignment(tx, bedTD3.id, "CLEANING", null, actorId);
      await customerRepository.setCurrentAssignment(tx, customer3.id, {
        status: "CHECKED_OUT",
        currentBedId: null,
        currentContractId: null,
      });
      await contractRepository.updateStatus(tx, contract3.id, "TERMINATED", {
        terminatedAt: checkOutDate3,
        terminationType: "BY_TENANT",
        terminationReason: "Chuyển chỗ ở gần trường hơn",
      });

      // Yêu cầu hoàn cọc — đang chờ duyệt (demo workflow hoàn cọc).
      const refundEntryNo = await generateSimpleNo(tx, { docType: "HC" });
      await depositLedgerRepository.addEntry(tx, {
        orgId: org.id,
        branchId: branchTD.id,
        contractId: contract3.id,
        customerId: customer3.id,
        entryNo: refundEntryNo,
        entryType: "REFUND",
        amount: -1_800_000n,
        reason: "Hoàn cọc sau khi trừ 200,000đ vệ sinh phòng",
        status: "PENDING",
        requestedBy: actorId,
      });
      return refundEntryNo;
    });

    console.log(`  KH-DEMO-003 (Lê Văn Cường) — CHECKED_OUT, yêu cầu hoàn cọc ${depositEntryNo} đang chờ duyệt`);
  }

  // ---- KH4: TD, PROSPECT, đặt chỗ giữ giường chưa check-in ----
  const existing4 = await findCustomerByCode("KH-DEMO-004");
  if (!existing4) {
    const bedTD4 = await bedByCode(branchTD.id, "A-102-B2");
    const customer4 = await db.transaction((tx) =>
      customerRepository.create(
        tx,
        org.id,
        "KH-DEMO-004",
        branchTD.id,
        {
          branchId: branchTD.id,
          fullName: "Phạm Thị Dung",
          gender: "FEMALE",
          phone: "0901000004",
          emergencyContact: { name: "Phạm Văn Cha", relationship: "Cha", phone: "0909000004" },
          occupation: "STUDENT",
          school: "Đại học Ngân hàng TP.HCM",
          source: "FANPAGE",
        },
        actorId,
      ),
    );

    await db.transaction(async (tx) => {
      const bookingNo = await generateDocNo(tx, { docType: "DC", branchCode: branchTD.code });
      await bookingRepository.create(
        tx,
        org.id,
        bookingNo,
        {
          branchId: branchTD.id,
          customerId: customer4.id,
          bedId: bedTD4.id,
          expectedCheckInDate: isoDate(addDays(now, 3)),
          expectedDurationMonths: 12,
          quotedPrice: "2000000",
          depositRequired: "2000000",
          holdHours: 48,
          source: "FANPAGE",
        },
        addDays(now, 2),
        actorId,
      );
    });

    console.log("  KH-DEMO-004 (Phạm Thị Dung) — PROSPECT, đang giữ giường A-102-B2");
  }

  // ---- KH5: BT, ACTIVE, đã trả đủ (khách sạch nợ) ----
  let customer5Id: string | null = null;
  const existing5 = await findCustomerByCode("KH-DEMO-005");
  if (!existing5) {
    const bedBT1 = await bedByCode(branchBT.id, "A-101-B1");
    const customer5 = await db.transaction((tx) =>
      customerRepository.create(
        tx,
        org.id,
        "KH-DEMO-005",
        branchBT.id,
        {
          branchId: branchBT.id,
          fullName: "Hoàng Văn Em",
          gender: "MALE",
          phone: "0901000005",
          emergencyContact: { name: "Hoàng Thị Mẹ", relationship: "Mẹ", phone: "0909000005" },
          occupation: "EMPLOYEE",
          company: "Công ty CP XYZ",
        },
        actorId,
      ),
    );
    customer5Id = customer5.id;

    const startDate5 = addMonths(now, -1);
    const contract5 = await db.transaction(async (tx) => {
      const contractNo = await generateDocNo(tx, { docType: "HD", branchCode: branchBT.code });
      return contractRepository.create(
        tx,
        org.id,
        contractNo,
        {
          branchId: branchBT.id,
          customerId: customer5.id,
          bedIds: [bedBT1.id],
          startDate: isoDate(startDate5),
          endDate: isoDate(addMonths(startDate5, 12)),
          durationMonths: 12,
          monthlyRent: "2000000",
          depositAmount: "2000000",
          depositMonths: 1,
          billingCycle: "MONTHLY",
          termsSnapshot: "Hợp đồng thuê giường theo bảng giá niêm yết — bản demo.",
        },
        actorId,
      );
    });

    const invoice5 = await db.transaction(async (tx) => {
      const assignment = await bedAssignmentRepository.create(tx, {
        orgId: org.id,
        branchId: branchBT.id,
        contractId: contract5.id,
        customerId: customer5.id,
        bedId: bedBT1.id,
        roomId: bedBT1.roomId,
        floorId: bedBT1.floorId,
        buildingId: bedBT1.buildingId,
        startDate: isoDate(startDate5),
        reason: "CHECK_IN",
        dailyRate: 2_000_000n / 30n,
        monthlyRate: 2_000_000n,
        createdBy: actorId,
      });
      await bedRepository.attachAssignment(tx, bedBT1.id, "OCCUPIED", assignment.id, actorId);
      await customerRepository.setCurrentAssignment(tx, customer5.id, {
        status: "ACTIVE",
        currentBranchId: branchBT.id,
        currentBedId: bedBT1.id,
        currentContractId: contract5.id,
      });
      await contractRepository.updateStatus(tx, contract5.id, "ACTIVE");
      const entryNo = await generateSimpleNo(tx, { docType: "COC" });
      await depositLedgerRepository.addEntry(tx, {
        orgId: org.id,
        branchId: branchBT.id,
        contractId: contract5.id,
        customerId: customer5.id,
        entryNo,
        entryType: "HOLD",
        amount: 2_000_000n,
        reason: "Tiền cọc nhận khi check-in",
        status: "EXECUTED",
        executedBy: actorId,
      });

      const p = await billingPeriodRepository.create(
        tx,
        org.id,
        {
          branchId: branchBT.id,
          code: `BT-${isoDate(startDate5).slice(0, 7)}`,
          periodFrom: isoDate(startDate5),
          periodTo: isoDate(addMonths(startDate5, 1)),
          dueDate: isoDate(addDays(startDate5, 10)),
        },
        actorId,
      );
      const invoiceNo = await generateDocNo(tx, { docType: "INV", branchCode: branchBT.code });
      const invoice = await invoiceRepository.create(tx, {
        orgId: org.id,
        branchId: branchBT.id,
        invoiceNo,
        contractId: contract5.id,
        customerId: customer5.id,
        billingPeriodId: p.id,
        periodFrom: p.periodFrom,
        periodTo: p.periodTo,
        dueDate: p.dueDate ?? undefined,
        subtotal: 2_000_000n,
        grandTotal: 2_000_000n,
        lines: [{ lineType: "RENT", description: "Tiền phòng kỳ 1", amount: 2_000_000n, unitPrice: 2_000_000n }],
      });
      await invoiceRepository.issue(tx, invoice.id, actorId);
      await billingPeriodRepository.markGenerated(tx, p.id, { invoiceCount: 1, totalAmount: 2_000_000n, generatedBy: actorId });
      return invoice;
    });

    await db.transaction(async (tx) => {
      const paymentNo = await generateSimpleNo(tx, { docType: "PT" });
      const payment = await paymentRepository.create(tx, {
        orgId: org.id,
        branchId: branchBT.id,
        paymentNo,
        customerId: customer5.id,
        payerName: "Hoàng Văn Em",
        amount: 2_000_000n,
        method: "CASH",
        receivedBy: actorId,
      });
      await paymentRepository.addAllocation(tx, {
        orgId: org.id,
        branchId: branchBT.id,
        paymentId: payment.id,
        invoiceId: invoice5.id,
        amount: 2_000_000n,
        allocatedBy: actorId,
      });
      await paymentRepository.updateAllocated(tx, payment.id, 2_000_000n, 0n);
      await invoiceRepository.applyPayment(tx, invoice5.id, 2_000_000n, 0n);
    });

    console.log("  KH-DEMO-005 (Hoàng Văn Em) — ACTIVE, đã trả đủ");
  } else {
    customer5Id = existing5.id;
  }

  // ---- KH6: BT, BLACKLISTED ----
  const existing6 = await findCustomerByCode("KH-DEMO-006");
  if (!existing6) {
    const customer6 = await db.transaction((tx) =>
      customerRepository.create(
        tx,
        org.id,
        "KH-DEMO-006",
        branchBT.id,
        {
          branchId: branchBT.id,
          fullName: "Vũ Thị Phương",
          gender: "FEMALE",
          phone: "0901000006",
          emergencyContact: { name: "Vũ Văn Cha", relationship: "Cha", phone: "0909000006" },
        },
        actorId,
      ),
    );
    await db.transaction((tx) =>
      customerRepository.setBlacklisted(tx, customer6.id, "Nợ quá hạn nhiều kỳ, mất liên lạc", actorId),
    );
    console.log("  KH-DEMO-006 (Vũ Thị Phương) — BLACKLISTED");
  }

  // ---- Ca quỹ tiền mặt: 1 ca OPEN (TD), 1 ca CLOSED có lệch nhỏ (BT) ----
  const [openSessionTD] = await db
    .select()
    .from(schema.cashSessions)
    .where(and(eq(schema.cashSessions.branchId, branchTD.id), eq(schema.cashSessions.status, "OPEN")));
  if (!openSessionTD) {
    await db.transaction(async (tx) => {
      const sessionNo = await generateSimpleNo(tx, { docType: "CA" });
      await cashSessionRepository.create(tx, {
        orgId: org.id,
        branchId: branchTD.id,
        sessionNo,
        staffId: actorId,
        openingBalance: 500_000n,
      });
    });
    console.log("  Ca quỹ TD — đang mở, tồn quỹ đầu ca 500,000đ");
  }

  const [closedSessionBT] = await db
    .select()
    .from(schema.cashSessions)
    .where(and(eq(schema.cashSessions.branchId, branchBT.id), eq(schema.cashSessions.status, "CLOSED")));
  if (!closedSessionBT && customer5Id) {
    await db.transaction(async (tx) => {
      const sessionNo = await generateSimpleNo(tx, { docType: "CA" });
      const openedAt = addDays(now, -1);
      const [session] = await tx
        .insert(schema.cashSessions)
        .values({
          orgId: org.id,
          branchId: branchBT.id,
          sessionNo,
          staffId: actorId,
          openedAt,
          openingBalance: 300_000n,
          status: "OPEN",
        })
        .returning();
      if (!session) throw new Error("failed to seed cash session");

      // systemTotal = tồn đầu ca (300,000) — không cộng thêm giao dịch mới để tránh
      // trùng số với thanh toán CASH của KH5 (đã ghi nhận trước openedAt của ca này).
      const systemTotal = 300_000n;
      const countedTotal = 280_000n;
      await cashSessionRepository.close(tx, session.id, {
        systemTotal,
        countedTotal,
        variance: countedTotal - systemTotal,
        varianceReason: "Thiếu tiền lẻ khi trả khách, đã nhắc nhở thu ngân",
      });
    });
    console.log("  Ca quỹ BT — đã đóng, lệch quỹ -20,000đ (có lý do)");
  }

  console.log("Seed demo complete.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
