import type { EventStatus, ParticipantStatus } from '@/types';

export interface CleanupDrive {
  id: string;
  title: string;
  description: string;
  locationName: string;
  wardNumber: number;
  scheduledStart: string;
  scheduledEnd: string;
  status: EventStatus;
  maxVolunteers: number | null;
  registeredCount: number;
}

export interface VolunteerRegistration {
  eventId: string;
  userId: string;
  status: ParticipantStatus;
  registeredAt: string;
}
