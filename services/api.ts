const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://africredit-backend-pn7.onrender.com/api/v1";

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.log("API error", { endpoint, status: response.status, data });
    throw new Error(
      data?.error?.message || data?.message || "Something went wrong. Please try again."
    );
  }

  return data;
}

// The backend may wrap the token (e.g. { success, data: { token } }),
// so check the common locations.
function extractToken(res: any): string | undefined {
  const token =
    res?.data?.token ??
    res?.data?.access_token ??
    res?.data?.accessToken ??
    res?.token ??
    res?.access_token ??
    res?.accessToken;

  return typeof token === "string" ? token : undefined;
}

// Login
export type LoginPayload = { phone_number: string; password: string };
export type LoginResponse = { token: string };

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log("Login response", res);

  const token = extractToken(res);
  if (!token) {
    throw new Error("Login succeeded but no token was returned.");
  }

  return { token };
}

// Signup, step 1: initiate registration, sends OTP
export type InitiateRegisterPayload = {
  phone_number: string;
  role: "borrower";
};
export type InitiateRegisterResponse = { message?: string };

export function initiateRegister(
  payload: InitiateRegisterPayload
): Promise<InitiateRegisterResponse> {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Signup, step 3: verify OTP + set password, completes registration
export type VerifyRegistrationPayload = {
  phone_number: string;
  otp: string;
  password: string;
};
export type VerifyRegistrationResponse = { token?: string };

export async function verifyRegistration(
  payload: VerifyRegistrationPayload
): Promise<VerifyRegistrationResponse> {
  const res = await apiRequest("/auth/verify-registration", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log("Verify registration response", res);

  return { token: extractToken(res) };
}

// Forgot password, step 1: sends a reset OTP to the registered number
export type ForgotPasswordPayload = { phone_number: string };
export type ForgotPasswordResponse = { message?: string };

export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<ForgotPasswordResponse> {
  console.log("Forgot password request", payload);

  const res = await apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log("Forgot password response", res);

  return res;
}

// Forgot password, step 2: verify the reset OTP
export type VerifyResetOtpPayload = { phone_number: string; otp: string };
export type VerifyResetOtpResponse = { message?: string };

export async function verifyResetOtp(
  payload: VerifyResetOtpPayload
): Promise<VerifyResetOtpResponse> {
  const res = await apiRequest("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log("Verify reset OTP response", res);

  return res;
}

export { API_URL };