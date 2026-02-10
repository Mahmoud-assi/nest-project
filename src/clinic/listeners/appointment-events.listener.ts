import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

/**
 * AppointmentEventsListener - Background work when appointments are booked
 * -------------------------------------------------------------------------
 * We don't make the user wait for email: emit an event, return the response,
 * then this listener runs asynchronously. (In production you'd use BullMQ + Redis
 * for retries and durability; EventEmitter is fine for demo.)
 */
@Injectable()
export class AppointmentEventsListener {
  @OnEvent('appointment.booked')
  async handleAppointmentBooked(payload: {
    appointmentId: string;
    patientEmail: string;
    doctorName: string | null;
    scheduledAt: Date;
  }) {
    // Simulate sending confirmation email (replace with real email service)
    console.log(
      `[Background] Sending confirmation email for appointment ${payload.appointmentId}`,
    );
    console.log(
      `  -> To: ${payload.patientEmail}, Doctor: ${payload.doctorName ?? 'N/A'}, At: ${payload.scheduledAt.toISOString()}`,
    );
  }
}
