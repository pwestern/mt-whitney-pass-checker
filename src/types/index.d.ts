export interface AvailabilityResponse {
  payload: Payload;
}

export interface Payload {
  date_availability: DateAvailability;
  next_available_date: string;
  permit_id: string;
}

export interface DateAvailability {
  [key: string]: DailyPassInformation;
}

export interface DailyPassInformation {
  is_secret_quota: boolean;
  remaining: number;
  show_walkup: boolean;
  total: number;
}

export interface Credentials {
  installed: InstalledCredentials;
}

interface InstalledCredentials {
  client_id: string;
  project_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_secret: string;
  redirect_uris: string[];
}
