export const AUTH_COOKIE_NAME = "fm_session";

export const authEnv = {
  appUser: process.env.APP_USER ?? "star",
  appPass: process.env.APP_PASS ?? "dust",
  appSessionToken: process.env.APP_SESSION_TOKEN ?? "fm-local-session-token"
};

export const isValidCredential = (username: string, password: string): boolean => {
  return username === authEnv.appUser && password === authEnv.appPass;
};