export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  mobileNumber?: string;
  countryCode?: string;
  gender?: string;
  dateOfBirth?: string;
  profilePhotoUrl?: string;
  qualification?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
