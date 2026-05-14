import Link from "next/link";
import { ZebraMark } from "@/components/ZebraLogo";
import { ForgotForm } from "./ForgotForm";

export const metadata = { title: "Reset your password · Zebra Data" };

export default function ForgotPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10 bg-surface">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="inline-flex items-center gap-2.5 text-ink mb-8">
          <ZebraMark className="w-8 h-8" />
          <span className="font-display font-semibold tracking-[-0.02em]">
            Zebra<span className="text-mid font-medium">Data</span>
          </span>
        </Link>
        <h1 className="font-display font-semibold text-[2rem] tracking-[-0.025em]">Reset your password</h1>
        <p className="mt-2 text-mid text-[0.95rem]">
          Enter the email associated with your account and we&apos;ll send you a reset link.
        </p>
        <div className="mt-7">
          <ForgotForm />
        </div>
        <div className="mt-6 text-sm text-mid">
          Remembered it? <Link href="/login" className="text-accent font-medium hover:underline">Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}
