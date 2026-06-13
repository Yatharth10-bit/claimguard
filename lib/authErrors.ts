export function resolveAuthSearchParamError(searchParams: {
  get: (key: string) => string | null;
}): string | null {
  const code = searchParams.get("error_code");
  const error = searchParams.get("error");
  const description = searchParams.get("error_description");

  if (code === "otp_expired") {
    return "That sign-in link has expired. Request a new one and try again.";
  }
  if (code === "otp_disabled") {
    return "Email sign-in links are disabled. Use your password or Google instead.";
  }
  if (error === "access_denied" && description) {
    return description.replace(/\+/g, " ");
  }
  if (error === "auth_callback_failed") {
    return "Google sign-in could not be completed. Please try again.";
  }
  if (error === "auth_not_configured") {
    return "Authentication is not configured on the server.";
  }
  if (error === "Supabase is not configured.") {
    return "Authentication is not configured on the server.";
  }
  if (error) {
    return error.replace(/\+/g, " ");
  }
  return null;
}