"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase/client";
import { createOrUpdateUser } from "@/lib/firebase/data";
import Icon from "@/components/ui/Icon";
import Alert from "@/components/ui/Alert";

function AuthCard({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const register = mode === "register";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (register && password !== repeatPassword) return setError("Mật khẩu không khớp.");
    if (register && username.trim().length > 20) return setError("Tên người dùng tối đa 20 ký tự.");
    setBusy(true);
    try {
      if (register) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: username.trim() });
        await createOrUpdateUser(credential.user, { username: username.trim(), authProvider: "email" });
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await createOrUpdateUser(credential.user, { authProvider: "password" });
      }
      router.push("/");
    } catch {
      setError(register ? "Đăng ký thất bại. Vui lòng kiểm tra thông tin và thử lại." : "Email hoặc mật khẩu không hợp lệ.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(""); setBusy(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await createOrUpdateUser(credential.user, { authProvider: "google.com" });
      router.push("/");
    } catch {
      setError("Đăng nhập với Google thất bại. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-[0_22px_70px_rgba(83,43,23,0.12)] sm:p-8">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-gold/20 text-lacquer"><Icon name={register ? "user-plus" : "login"} size={28} /></div>
        <h1 className="font-serif text-3xl font-bold text-lacquer">{register ? "Tạo tài khoản" : "Chào mừng trở lại"}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{register ? "Đăng ký để chia sẻ công thức và góp chuyện quanh mâm cơm Việt." : "Đăng nhập để quản lý công thức và tham gia bình luận."}</p>
      </div>
      {error && <div className="mb-4"><Alert tone="danger">{error}</Alert></div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {register && <label className="block"><span className="form-label"><Icon name="user" size={15} /> Tên người dùng</span><input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} required className="form-input" placeholder="Ví dụ: Bếp Nhà Na" /></label>}
        <label className="block"><span className="form-label"><Icon name="mail" size={15} /> Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input" placeholder="ban@example.com" /></label>
        <label className="block"><span className="form-label"><Icon name="lock" size={15} /> Mật khẩu</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="form-input" placeholder="••••••••" minLength={6} /></label>
        {register && <label className="block"><span className="form-label"><Icon name="lock" size={15} /> Nhập lại mật khẩu</span><input type="password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} required className="form-input" placeholder="••••••••" minLength={6} /></label>}
        <button disabled={busy} className="btn-primary w-full justify-center">{busy ? <span className="size-4 animate-spin rounded-full border-2 border-ivory/30 border-t-ivory" /> : <Icon name={register ? "user-plus" : "login"} size={17} />} {register ? "Đăng ký" : "Đăng nhập"}</button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-border" /><span>hoặc</span><span className="h-px flex-1 bg-border" /></div>
      <button type="button" onClick={() => void handleGoogle()} disabled={busy} className="btn-secondary w-full justify-center"><span className="grid size-5 place-items-center rounded-full bg-white font-bold text-xs text-[#4285f4]">G</span> {register ? "Đăng ký với Google" : "Đăng nhập với Google"}</button>
    </div>
  );
}

export function LoginForm() { return <AuthCard mode="login" />; }
export function RegisterForm() { return <AuthCard mode="register" />; }
