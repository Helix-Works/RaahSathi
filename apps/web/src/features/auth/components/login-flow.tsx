"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, MessageSquareText, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/features/auth/api";
import { getAuthErrorPresentation, type AuthErrorPresentation } from "@/features/auth/errors";
import {
  mobileFormSchema,
  otpFormSchema,
  type MobileFormValues,
  type OtpFormValues,
} from "@/features/auth/schemas/login";
import type { SafeReturnPath } from "@/features/auth/safe-return-path";
import type { OtpChallenge } from "@/features/auth/types";
import type { MessageDictionary } from "@/i18n";

type LoginFlowProps = Readonly<{
  messages: MessageDictionary;
  returnTo: SafeReturnPath;
}>;

function ApiErrorSummary({
  error,
  title,
  correlationLabel,
}: Readonly<{
  error: AuthErrorPresentation;
  title: string;
  correlationLabel: string;
}>) {
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    summaryRef.current?.focus();
  }, [error]);

  return (
    <Alert ref={summaryRef} variant="error" role="alert" tabIndex={-1}>
      <p className="font-extrabold">{title}</p>
      <p>{error.message}</p>
      {error.correlationId ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {correlationLabel}: {error.correlationId}
        </p>
      ) : null}
    </Alert>
  );
}

export function LoginFlow({ messages, returnTo }: LoginFlowProps) {
  const router = useRouter();
  const [challenge, setChallenge] = useState<OtpChallenge>();
  const [apiError, setApiError] = useState<AuthErrorPresentation>();
  const requestForm = useForm<MobileFormValues>({
    resolver: zodResolver(mobileFormSchema),
    defaultValues: { mobileNumber: "" },
  });
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    if (challenge) {
      otpForm.setFocus("otp");
    }
  }, [challenge, otpForm]);

  const authMessages = messages.auth;
  const mobileErrorCode = requestForm.formState.errors.mobileNumber?.message;
  const mobileError =
    mobileErrorCode === "required"
      ? authMessages.requiredMobile
      : mobileErrorCode
        ? authMessages.invalidMobile
        : undefined;
  const otpErrorCode = otpForm.formState.errors.otp?.message;
  const otpError =
    otpErrorCode === "required"
      ? authMessages.requiredOtp
      : otpErrorCode
        ? authMessages.invalidOtpFormat
        : undefined;

  const presentError = (error: unknown) => {
    setApiError(getAuthErrorPresentation(error, authMessages));
  };

  const requestOtp = requestForm.handleSubmit(async (values) => {
    setApiError(undefined);

    try {
      const nextChallenge = await authApi.requestOtp(values);
      setChallenge(nextChallenge);
      otpForm.reset();
    } catch (error: unknown) {
      presentError(error);
    }
  });

  const verifyOtp = otpForm.handleSubmit(async (values) => {
    if (!challenge) {
      return;
    }

    setApiError(undefined);

    try {
      await authApi.verifyOtp({
        challengeId: challenge.challengeId,
        otp: values.otp,
      });
      router.replace(returnTo);
      router.refresh();
    } catch (error: unknown) {
      presentError(error);
    }
  });

  const restart = () => {
    setChallenge(undefined);
    setApiError(undefined);
    otpForm.reset();
  };

  return (
    <Card className="overflow-hidden border-primary/20">
      <div className="h-1 bg-primary" aria-hidden="true" />
      <CardHeader>
        <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
          {challenge ? (
            <MessageSquareText className="size-6" aria-hidden="true" />
          ) : (
            <ShieldCheck className="size-6" aria-hidden="true" />
          )}
        </div>
        <h2 className="text-2xl font-black">
          {challenge ? authMessages.sentTitle : authMessages.requestTitle}
        </h2>
        {challenge ? (
          <p className="leading-7 text-muted-foreground">
            {authMessages.sentDescription.replace(
              "{destination}",
              challenge.maskedDestination,
            )}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-5">
        <Alert variant="info">{authMessages.syntheticNotice}</Alert>

        {apiError ? (
          <ApiErrorSummary
            error={apiError}
            title={authMessages.errorSummaryTitle}
            correlationLabel={messages.errors.correlationLabel}
          />
        ) : null}

        {!challenge ? (
          <form className="space-y-5" onSubmit={requestOtp} noValidate>
            <div className="space-y-2">
              <Label htmlFor="synthetic-mobile">{authMessages.mobileLabel}</Label>
              <Input
                id="synthetic-mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                placeholder={authMessages.mobilePlaceholder}
                aria-invalid={Boolean(mobileError)}
                aria-describedby={
                  mobileError ? "synthetic-mobile-help synthetic-mobile-error" : "synthetic-mobile-help"
                }
                {...requestForm.register("mobileNumber")}
              />
              <p id="synthetic-mobile-help" className="text-sm leading-6 text-muted-foreground">
                {authMessages.mobileHelp}
              </p>
              {mobileError ? (
                <p id="synthetic-mobile-error" className="text-sm font-bold text-error">
                  {mobileError}
                </p>
              ) : null}
            </div>

            <Button className="w-full" size="lg" type="submit" disabled={requestForm.formState.isSubmitting}>
              {requestForm.formState.isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {requestForm.formState.isSubmitting
                ? authMessages.requestingOtp
                : authMessages.requestOtp}
            </Button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={verifyOtp} noValidate>
            <div className="space-y-2">
              <Label htmlFor="synthetic-otp">{authMessages.otpLabel}</Label>
              <Input
                id="synthetic-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder={authMessages.otpPlaceholder}
                aria-invalid={Boolean(otpError)}
                aria-describedby={
                  otpError ? "synthetic-otp-help synthetic-otp-error" : "synthetic-otp-help"
                }
                {...otpForm.register("otp")}
              />
              <p id="synthetic-otp-help" className="text-sm leading-6 text-muted-foreground">
                {authMessages.otpHelp}
              </p>
              {otpError ? (
                <p id="synthetic-otp-error" className="text-sm font-bold text-error">
                  {otpError}
                </p>
              ) : null}
            </div>

            <Button className="w-full" size="lg" type="submit" disabled={otpForm.formState.isSubmitting}>
              {otpForm.formState.isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {otpForm.formState.isSubmitting
                ? authMessages.verifyingOtp
                : authMessages.verifyOtp}
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              type="button"
              onClick={restart}
              disabled={otpForm.formState.isSubmitting}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {authMessages.changeMobile}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
