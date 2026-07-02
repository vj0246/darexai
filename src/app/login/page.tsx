export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-[360px] text-center">
        <div className="w-10 h-10 rounded-xl bg-teal/15 grid place-items-center text-teal mx-auto mb-6 text-lg">◆</div>
        <h1 className="text-[24px] font-medium tracking-tight mb-2">Sign in to DareXAI</h1>
        <p className="text-sec text-[14px] mb-8">Your AI employee is waiting.</p>
        <a href="/api/auth/dev"
          className="flex items-center justify-center gap-3 w-full py-3 rounded-xl bg-card border border-line2 hover:border-teal/40 text-[14px] transition">
          Enter demo workspace
        </a>
        <p className="text-mut text-[11px] mt-6">Demo login — no signup required.</p>
      </div>
    </main>
  );
}
