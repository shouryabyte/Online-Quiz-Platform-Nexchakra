import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { CreditCard, Crown, ArrowRight } from "lucide-react";

import { Layout } from "../components/Layout";
import { createRazorpayOrder, logout, me, verifyRazorpayPayment, type PublicUser } from "../lib/api";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("RAZORPAY_SCRIPT_FAILED"));
    document.body.appendChild(script);
  });
}

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await me();
        if (!alive) return;
        setUser(u.user);
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function startCheckout(plan: "premium_month" | "premium_year") {
    setError(null);
    setLoading(true);
    try {
      if (!user) {
        await router.push("/login");
        return;
      }

      const orderRes = await createRazorpayOrder(plan);
      await loadRazorpayScript();

      if (!window.Razorpay) throw new Error("RAZORPAY_NOT_AVAILABLE");

      const rzp = new window.Razorpay({
        key: orderRes.keyId,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: "NexChakra Quiz",
        description: "Premium subscription",
        order_id: orderRes.order.id,
        handler: async (response: any) => {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            await router.push("/dashboard");
          } catch (e) {
            setError(e instanceof Error ? e.message : "VERIFY_FAILED");
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: "#7c5cff"
        }
      });

      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "PAYMENT_FAILED");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout
      user={user}
      onLogout={async () => {
        try {
          await logout();
        } finally {
          await router.push("/login");
        }
      }}
    >
      <section className="glass rounded-3xl p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Pricing</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">Unlock Premium analytics and creator tools.</p>
          </div>
          {user?.isPremium ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100">
              <Crown className="h-4 w-4" />
              Premium active
            </div>
          ) : null}
        </div>

        {error ? <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs font-semibold tracking-wide text-white/60">Premium Monthly</div>
            <div className="mt-2 text-3xl font-extrabold text-white">₹19.90</div>
            <div className="mt-1 text-sm text-white/60">30 days access</div>
            <ul className="mt-4 list-inside list-disc text-sm text-white/75">
              <li>Advanced analytics</li>
              <li>Creator tools</li>
              <li>Priority features</li>
            </ul>
            <button
              type="button"
              onClick={() => startCheckout("premium_month")}
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500/90 via-fuchsia-500/80 to-cyan-400/80 px-6 py-3 text-sm font-extrabold text-white shadow-glow transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              {loading ? "Processing..." : "Upgrade"}
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs font-semibold tracking-wide text-white/60">Premium Yearly</div>
            <div className="mt-2 text-3xl font-extrabold text-white">₹199.00</div>
            <div className="mt-1 text-sm text-white/60">365 days access</div>
            <ul className="mt-4 list-inside list-disc text-sm text-white/75">
              <li>Everything in Monthly</li>
              <li>Best value plan</li>
              <li>Early access</li>
            </ul>
            <button
              type="button"
              onClick={() => startCheckout("premium_year")}
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:bg-white/10 disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              {loading ? "Processing..." : "Upgrade"}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <Link href="/analytics" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100">
            Explore analytics <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}