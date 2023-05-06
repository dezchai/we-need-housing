import 'dotenv/config'

export const SLEEP_TIME = parseInt(process.env["SLEEP_TIME"] ?? "10000");
export const ERROR_TIME = parseInt(process.env["ERROR_TIME"] ?? "30000");
export const WEBHOOK_URL = process.env["WEBHOOK_URL"] ?? ""; // WEBHOOK_URL is required
