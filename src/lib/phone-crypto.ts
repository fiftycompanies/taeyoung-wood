/**
 * AES-256-GCM Phone PII Encryption — REVRUN 정책(site-template/admin 동형).
 *
 * 별도 Next 앱이라 import 불가 → 복제. 동일 키 DBMKT_PHONE_ENCRYPTION_KEY를
 * 이 Vercel 프로젝트에도 주입해야 함(admin과 같은 Supabase·같은 phone 컬럼 공유
 * → 키가 일치해야 어드민에서 복호 가능).
 */
import { createCipheriv, randomBytes } from "crypto";

function getKey(): Buffer {
  const hex = process.env.DBMKT_PHONE_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error("DBMKT_PHONE_ENCRYPTION_KEY 환경변수가 설정되지 않았습니다");
  }
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32) {
    throw new Error("DBMKT_PHONE_ENCRYPTION_KEY는 32바이트(hex 64자)여야 합니다");
  }
  return buf;
}

interface EncryptedData {
  v: number;
  iv: string;
  enc: string;
  tag: string;
}

/** 평문 → 암호문 (JSON string) */
export function encryptPhone(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const data: EncryptedData = {
    v: 1,
    iv: iv.toString("base64"),
    enc: encrypted.toString("base64"),
    tag: tag.toString("base64"),
  };
  return JSON.stringify(data);
}

/** 암호문(JSON) 형식 여부 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value || value[0] !== "{") return false;
  try {
    const d = JSON.parse(value);
    return typeof d === "object" && d !== null && "v" in d && "iv" in d && "enc" in d && "tag" in d;
  } catch {
    return false;
  }
}

/** 한국 휴대폰 번호 완결성 검증 — 클라/서버 공용 SSOT. "-" 유무 무관. */
export function isCompleteKrMobile(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (/^010\d{8}$/.test(digits)) return true; // 010 + 8자리
  return /^01[16789]\d{7,8}$/.test(digits); // 레거시 01x
}
