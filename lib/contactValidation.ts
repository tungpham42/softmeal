export const CONTACT_TOPICS = [
  "Góp ý về website",
  "Hỗ trợ tài khoản",
  "Chia sẻ / báo lỗi công thức",
  "Hợp tác & quảng cáo",
  "Khác",
] as const;

export const MIN_MESSAGE = 10;
export const MAX_MESSAGE = 2000;

export type ContactErrors = {
  name?: string;
  email?: string;
  message?: string;
  form?: string;
};

export function validateName(value: string) {
  const v = value.trim();
  if (!v) return "Bạn chưa nhập họ tên.";
  if (v.length < 2) return `Họ tên quá ngắn (${v.length}/2 ký tự tối thiểu).`;
  if (v.length > 80) return "Họ tên tối đa 80 ký tự.";
  return "";
}

export function validateEmail(value: string) {
  const v = value.trim();
  if (!v) return "Bạn chưa nhập địa chỉ email.";
  if (/\s/.test(v)) return "Email không được chứa khoảng trắng.";
  if (!v.includes("@"))
    return "Email thiếu ký tự “@”. Ví dụ đúng: ban@example.com";
  if (v.split("@").length > 2) return "Email chỉ được chứa một ký tự “@”.";
  const [local, domain = ""] = v.split("@");
  if (!local) return "Email thiếu phần tên trước “@”. Ví dụ: ban@example.com";
  if (!domain) return "Email thiếu tên miền sau “@”. Ví dụ: ban@example.com";
  if (!domain.includes("."))
    return "Tên miền email thiếu phần đuôi, ví dụ “.com” hoặc “.vn”.";
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes(".."))
    return "Tên miền email không hợp lệ (dấu chấm đặt sai vị trí).";
  if (v.length > 120) return "Email tối đa 120 ký tự.";
  return "";
}

export function validateMessage(value: string) {
  const len = value.trim().length;
  if (!len) return "Bạn chưa nhập nội dung lời nhắn.";
  if (len < MIN_MESSAGE)
    return `Nội dung còn thiếu ${MIN_MESSAGE - len} ký tự (tối thiểu ${MIN_MESSAGE} ký tự, hiện có ${len}).`;
  if (len > MAX_MESSAGE) return `Nội dung tối đa ${MAX_MESSAGE} ký tự.`;
  return "";
}
