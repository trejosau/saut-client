"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { AppNavbar } from "@/core/layout/AppNavbar";
import { startEmailLogin, startGoogleLogin } from "@/modules/auth/client/api";
import { savePendingLogin } from "@/modules/auth/client/session";

const LoginModal = dynamic(() => import("@/modules/auth/ui/LoginModal"), {
    ssr: false,
});

function LandingHeaderContent() {
    const [loginOpen, setLoginOpen] = React.useState(false);
    const router = useRouter();

    const handleStartEmail = async (email: string) => {
        const response = await startEmailLogin(email);
        savePendingLogin({
            email,
            delivery: response.delivery,
            code: response.code,
            resendAfterSec: response.resend_after_sec,
            expiresInSec: response.expires_in_sec,
        });
        setLoginOpen(false);
        router.push("/auth/verify");
    };

    return (
        <header className="sticky top-0 z-50 border-b border-hairline">
            <div className="bg-charcoal text-white">
                <div className="saut-container flex min-h-9 items-center justify-center gap-5 text-center text-xs font-bold uppercase">
                    <span>EnvÃ­os a todo MÃ©xico</span>
                    <span className="hidden h-1 w-1 rounded-full bg-primary sm:block" />
                    <span className="hidden sm:block">ProducciÃ³n cuidada</span>
                    <span className="hidden h-1 w-1 rounded-full bg-primary md:block" />
                    <span className="hidden md:block">DiseÃ±os personalizados</span>
                </div>
            </div>

            <React.Suspense fallback={<div className="h-[72px] bg-soft-cloud" />}>
                <AppNavbar onLoginRequested={() => setLoginOpen(true)} />
            </React.Suspense>

            <LoginModal
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
                onContinueEmail={handleStartEmail}
                onGoogle={() => {
                    const returnTo =
                        window.location.pathname +
                        window.location.search +
                        window.location.hash;
                    return startGoogleLogin(returnTo);
                }}
            />
        </header>
    );
}

export function LandingHeader() {
    return (
        <React.Suspense fallback={null}>
            <LandingHeaderContent />
        </React.Suspense>
    );
}
