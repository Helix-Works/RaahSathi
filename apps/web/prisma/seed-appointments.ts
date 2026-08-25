import type { PrismaClient } from "@prisma/client";

const rtos = [
  {
    id: "50000000-0000-4000-8000-000000000001",
    code: "SYNTHETIC_ROHINI",
    nameEn: "Synthetic Rohini RTO",
    nameHi: "कृत्रिम रोहिणी आरटीओ",
    district: "North West Delhi",
    operationalStatus: "AVAILABLE" as const,
    bookingServiceStatus: "AVAILABLE" as const,
  },
  {
    id: "50000000-0000-4000-8000-000000000002",
    code: "SYNTHETIC_SOUTH_DELHI",
    nameEn: "Synthetic South Delhi RTO",
    nameHi: "कृत्रिम दक्षिण दिल्ली आरटीओ",
    district: "South Delhi",
    operationalStatus: "AVAILABLE" as const,
    bookingServiceStatus: "BOOKING_SERVICE_UNAVAILABLE" as const,
  },
  {
    id: "50000000-0000-4000-8000-000000000003",
    code: "SYNTHETIC_LONI_ROAD",
    nameEn: "Synthetic Loni Road RTO",
    nameHi: "कृत्रिम लोनी रोड आरटीओ",
    district: "North East Delhi",
    operationalStatus: "CENTER_UNAVAILABLE" as const,
    bookingServiceStatus: "AVAILABLE" as const,
  },
] as const;

const delhiOffsetMinutes = 330;

function dateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function delhiDateKey(value: Date): string {
  return dateKey(new Date(value.getTime() + delhiOffsetMinutes * 60_000));
}

function requireSeedDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || dateKey(parsed) !== value) {
    throw new Error("RAAHSATHI_DEMO_SEED_DATE must be a valid YYYY-MM-DD date.");
  }
  return value;
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
}

const seedDate = requireSeedDate(process.env.RAAHSATHI_DEMO_SEED_DATE ?? delhiDateKey(new Date()));
const releasedAt = new Date(`${addDays(seedDate, -1)}T00:00:00.000Z`);

const slots = [
  { id: "51000000-0000-4000-8000-000000000001", date: addDays(seedDate, 1), startTime: "09:00", endTime: "09:30", capacity: 2, bookedCount: 0, released: true },
  { id: "51000000-0000-4000-8000-000000000002", date: addDays(seedDate, 1), startTime: "09:30", endTime: "10:00", capacity: 1, bookedCount: 1, released: true },
  { id: "51000000-0000-4000-8000-000000000003", date: addDays(seedDate, 2), startTime: "10:00", endTime: "10:30", capacity: 2, bookedCount: 0, released: false },
] as const;

export async function seedSyntheticAppointments(database: PrismaClient): Promise<void> {
  for (const rto of rtos) {
    await database.rto.upsert({
      where: { id: rto.id },
      create: rto,
      update: {
        code: rto.code,
        nameEn: rto.nameEn,
        nameHi: rto.nameHi,
        district: rto.district,
        operationalStatus: rto.operationalStatus,
        bookingServiceStatus: rto.bookingServiceStatus,
      },
    });
  }

  for (const slot of slots) {
    await database.appointmentSlot.upsert({
      where: { id: slot.id },
      create: {
        id: slot.id,
        rtoId: rtos[0].id,
        serviceKey: "LEARNER_LICENCE",
        date: new Date(`${slot.date}T00:00:00.000Z`),
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        bookedCount: slot.bookedCount,
        releasedAt: slot.released ? releasedAt : null,
      },
      update: {
        rtoId: rtos[0].id,
        serviceKey: "LEARNER_LICENCE",
        date: new Date(`${slot.date}T00:00:00.000Z`),
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        bookedCount: slot.bookedCount,
        releasedAt: slot.released ? releasedAt : null,
      },
    });
  }
}
