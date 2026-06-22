/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Patient {
  id: string;
  token: number;
  name: string;
  addedAt: number;
  status: 'waiting' | 'current' | 'seen' | 'cancelled';
  calledAt?: number;
  completedAt?: number;
  cancelledAt?: number;
  isEmergency?: boolean;
}

export interface QueueState {
  patients: Patient[];
  averageConsultTime: number; // in minutes
  nextTokenNumber: number;
}

export type QueueAction =
  | { type: 'ADD_PATIENT'; name: string; isEmergency?: boolean }
  | { type: 'CALL_NEXT' }
  | { type: 'UPDATE_CONSULT_TIME'; mins: number }
  | { type: 'RESET_QUEUE' }
  | { type: 'CANCEL_PATIENT'; id: string }
  | { type: 'TOGGLE_EMERGENCY'; id: string }
  | { type: 'COMPLETE_PATIENT'; id: string };

export type ServerMessage =
  | { type: 'STATE_INIT'; state: QueueState }
  | { type: 'STATE_UPDATE'; state: QueueState }
  | { type: 'PONG'; ts: number };

export type ClientMessage =
  | { type: 'ACTION'; action: QueueAction }
  | { type: 'PING'; ts: number };
