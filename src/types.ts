// Shared types for the app

export type GuestStatus = 'מגיע' | 'לא מגיע' | 'אולי' | 'מספר לא תקין' | 'טרם ענה';

export interface Guest {
  _id: string;
  name: string;
  phone: string;
  quantity: number;
  confirmedQuantity?: number;
  status: GuestStatus;
  wave: number;
  table?: string;
}

export interface Wave {
  id: number;
  _id?: string;
  name: string;
  date: string;
  time: string;
  type: 'whatsapp' | 'sms' | 'phone';
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sendCount?: number;
  active?: boolean;
}

export interface Event {
  _id: string;
  name: string;
  groomName?: string;
  brideName?: string;
  date: string;
  location: string;
  description: string;
  guests: Guest[];
  waves: Wave[];
  wazeLink?: string;
  payboxLink?: string;
  bitLink?: string;
}

export interface User {
  phoneNumber: string;
  name: string;
  isFirstTime: boolean;
  events: Event[];
  groomPhone?: string;
  bridePhone?: string;
  receiveStatusUpdates?: boolean;
} 