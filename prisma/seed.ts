/**
 * Database Seeder - Populates the database with initial data for testing.
 * Run with: npx prisma db seed
 *
 * Uses upsert / get-or-create so running multiple times does not create duplicates.
 * Admin password is hashed with bcrypt (10 rounds) so login works with password123.
 */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient, type Clinic } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Set it in .env or environment.');
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10; // Same as UsersService so login bcrypt.compare works

async function main() {
  console.log('Seeding database...');

  const hashedAdminPassword = await bcrypt.hash('password123', SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: 'admin@clinic.com' },
    create: {
      email: 'admin@clinic.com',
      password: hashedAdminPassword,
      name: 'Clinic Admin',
      role: 'ADMIN',
    },
    update: {
      password: hashedAdminPassword,
      name: 'Clinic Admin',
      role: 'ADMIN',
    },
  });
  console.log('Admin user: admin@clinic.com');

  const clinic1: Clinic =
    (await prisma.clinic.findFirst({
      where: { name: 'City General Hospital' },
    })) ??
    (await prisma.clinic.create({
      data: { name: 'City General Hospital', address: '123 Main St' },
    }));
  const clinic2: Clinic =
    (await prisma.clinic.findFirst({ where: { name: 'Elite Dental Care' } })) ??
    (await prisma.clinic.create({
      data: { name: 'Elite Dental Care', address: '456 Oak Ave' },
    }));
  console.log('Clinics: City General Hospital, Elite Dental Care');

  const doctorEmails = [
    'dr.smith@clinic.com',
    'dr.jones@clinic.com',
    'dr.williams@clinic.com',
  ];
  const doctorNames = ['Dr. Smith', 'Dr. Jones', 'Dr. Williams'];
  const clinics: Clinic[] = [clinic1, clinic1, clinic2];
  const doctorIds: string[] = [];

  for (let i = 0; i < 3; i++) {
    const hashed = await bcrypt.hash('password123', SALT_ROUNDS);
    const doc = await prisma.user.upsert({
      where: { email: doctorEmails[i] },
      create: {
        email: doctorEmails[i],
        password: hashed,
        name: doctorNames[i],
        role: 'DOCTOR',
        clinicId: clinics[i].id,
      },
      update: {
        password: hashed,
        name: doctorNames[i],
        role: 'DOCTOR',
        clinicId: clinics[i].id,
      },
    });
    doctorIds.push(doc.id);
  }
  console.log('Doctors: 3 created/updated');

  for (const doctorId of doctorIds) {
    await prisma.workingHour.deleteMany({ where: { doctorId } });
    await prisma.workingHour.createMany({
      data: [
        { doctorId, dayOfWeek: 1, startMinutes: 540, endMinutes: 720 },
        { doctorId, dayOfWeek: 1, startMinutes: 780, endMinutes: 1020 },
        { doctorId, dayOfWeek: 2, startMinutes: 540, endMinutes: 1020 },
        { doctorId, dayOfWeek: 3, startMinutes: 540, endMinutes: 720 },
        { doctorId, dayOfWeek: 4, startMinutes: 540, endMinutes: 1020 },
        { doctorId, dayOfWeek: 5, startMinutes: 540, endMinutes: 720 },
      ],
    });
  }
  console.log(
    'Working hours: set for all doctors (Mon–Fri, 09:00–17:00 style)',
  );

  const patientEmails = ['patient1@example.com', 'patient2@example.com'];
  const patientNames = ['Alice Patient', 'Bob Patient'];
  for (let i = 0; i < 2; i++) {
    const hashed = await bcrypt.hash('password123', SALT_ROUNDS);
    await prisma.user.upsert({
      where: { email: patientEmails[i] },
      create: {
        email: patientEmails[i],
        password: hashed,
        name: patientNames[i],
        role: 'PATIENT',
      },
      update: {
        password: hashed,
        name: patientNames[i],
        role: 'PATIENT',
      },
    });
  }
  console.log('Patients: 2 created/updated');

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
