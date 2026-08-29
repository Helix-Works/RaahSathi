"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  addressDataSchema,
  personalDetailsDataSchema,
  serviceDetailsDataSchema,
  type AddressData,
  type ApplicationSectionData,
  type ApplicationSectionKey,
  type PersonalDetailsData,
  type ServiceDetailsData,
  type ServiceKey,
} from "@raahsathi/contracts/applications";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  type FieldError,
  type FieldValues,
  type Path,
  type UseFormReturn,
  useForm,
} from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getApplicationErrorPresentation,
  readApplicationFieldErrors,
  type ApplicationErrorPresentation,
} from "@/features/applications/application-errors";
import type { Locale, MessageDictionary } from "@/i18n";

export type SectionSubmitAction = "save" | "complete";

type PersistSection = (
  data: ApplicationSectionData,
  action: SectionSubmitAction,
) => Promise<void>;

type SectionFormProps = Readonly<{
  applicationId: string;
  sectionKey: ApplicationSectionKey;
  serviceKey: ServiceKey;
  initialData: unknown;
  locale: Locale;
  messages: MessageDictionary;
  onPersist: PersistSection;
}>;

type FormMessages = MessageDictionary["applications"];

const districtValues = [
  "CENTRAL",
  "EAST",
  "NEW_DELHI",
  "NORTH",
  "NORTH_WEST",
  "SOUTH",
  "SOUTH_WEST",
  "WEST",
] as const;

const districtLabels = {
  en: {
    CENTRAL: "Central Delhi",
    EAST: "East Delhi",
    NEW_DELHI: "New Delhi",
    NORTH: "North Delhi",
    NORTH_WEST: "North West Delhi",
    SOUTH: "South Delhi",
    SOUTH_WEST: "South West Delhi",
    WEST: "West Delhi",
  },
  hi: {
    CENTRAL: "मध्य दिल्ली",
    EAST: "पूर्वी दिल्ली",
    NEW_DELHI: "नई दिल्ली",
    NORTH: "उत्तरी दिल्ली",
    NORTH_WEST: "उत्तर पश्चिम दिल्ली",
    SOUTH: "दक्षिण दिल्ली",
    SOUTH_WEST: "दक्षिण पश्चिम दिल्ली",
    WEST: "पश्चिम दिल्ली",
  },
} as const;

const declarationFormSchema = z.object({
  accepted: z.boolean().refine((accepted) => accepted),
}).strict();
type DeclarationFormValues = z.infer<typeof declarationFormSchema>;

function fieldMessage(error: FieldError | undefined, localMessage: string): string | undefined {
  if (!error) return undefined;
  return error.type.startsWith("server.") && error.message
    ? error.message
    : localMessage;
}

function backendFieldMessage(code: string, messages: FormMessages): string {
  return code === "required" ? messages.requiredError : messages.validationError;
}

function useSubmissionErrors<TValues extends FieldValues>(
  form: UseFormReturn<TValues>,
  knownFields: readonly Path<TValues>[],
  messages: FormMessages,
): Readonly<{
  summary?: ApplicationErrorPresentation;
  clear: () => void;
  present: (error: unknown) => void;
}> {
  const [summary, setSummary] = useState<ApplicationErrorPresentation>();

  return {
    summary,
    clear: () => setSummary(undefined),
    present: (error: unknown) => {
      const fieldErrors = readApplicationFieldErrors(error, knownFields);
      const firstField = Object.keys(fieldErrors.mapped)[0] as Path<TValues> | undefined;

      for (const [field, code] of Object.entries(fieldErrors.mapped)) {
        form.setError(field as Path<TValues>, {
          type: `server.${code}`,
          message: backendFieldMessage(code, messages),
        });
      }

      if (firstField) {
        form.setFocus(firstField);
      }

      setSummary(getApplicationErrorPresentation(error, messages));
    },
  };
}

function FormSummary({
  applicationId,
  localValidation,
  messages,
  summary,
}: Readonly<{
  applicationId: string;
  localValidation: boolean;
  messages: FormMessages;
  summary?: ApplicationErrorPresentation;
}>) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (summary) summaryRef.current?.focus();
  }, [summary]);

  if (!summary && !localValidation) return null;

  const message = summary?.message ?? messages.validationError;
  const action = summary?.action;

  return (
    <Alert ref={summaryRef} variant="error" role="alert" tabIndex={-1}>
      <AlertTitle>{messages.errorSummaryTitle}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      {summary?.correlationId ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {messages.referenceLabel}: {summary.correlationId}
        </p>
      ) : null}
      {action ? (
        <Button
          className="mt-3"
          type="button"
          variant="outline"
          onClick={() => {
            if (action === "reload") {
              window.location.reload();
              return;
            }
            router.push(`/login?returnTo=${encodeURIComponent(`/applications/${applicationId}`)}`);
          }}
        >
          {action === "reload" ? messages.reloadLatest : messages.signInAgain}
        </Button>
      ) : null}
    </Alert>
  );
}

function FormActions<TValues extends FieldValues>({
  form,
  pendingAction,
  run,
  messages,
}: Readonly<{
  form: UseFormReturn<TValues>;
  pendingAction?: SectionSubmitAction;
  run: (action: SectionSubmitAction) => void;
  messages: FormMessages;
}>) {
  const pending = form.formState.isSubmitting || Boolean(pendingAction);

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:flex-wrap">
      <Button type="button" variant="secondary" disabled={pending} onClick={() => run("save")}>
        {pendingAction === "save" ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
        {pendingAction === "save" ? messages.saving : messages.saveDraft}
      </Button>
      <Button type="button" disabled={pending} onClick={() => run("complete")}>
        {pendingAction === "complete" ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
        {pendingAction === "complete" ? messages.saving : messages.saveAndContinue}
      </Button>
    </div>
  );
}

function useFormSubmissionDispatcher<TValues extends FieldValues>(
  form: UseFormReturn<TValues>,
  setPendingAction: (action: SectionSubmitAction | undefined) => void,
  submit: (values: TValues, action: SectionSubmitAction) => Promise<void>,
): (action: SectionSubmitAction) => void {
  const operationLock = useRef(false);

  return (action) => {
    if (operationLock.current) return;
    operationLock.current = true;
    setPendingAction(action);
    const finish = () => {
      operationLock.current = false;
      setPendingAction(undefined);
    };
    void form.handleSubmit(
      async (values) => {
        try {
          await submit(values, action);
        } finally {
          finish();
        }
      },
      finish,
    )();
  };
}

function PersonalDetailsForm(props: SectionFormProps) {
  const parsed = personalDetailsDataSchema.safeParse(props.initialData);
  const form = useForm<PersonalDetailsData>({
    resolver: zodResolver(personalDetailsDataSchema),
    defaultValues: parsed.success ? parsed.data : { fullName: "", dateOfBirth: "" },
  });
  const errors = useSubmissionErrors(form, ["fullName", "dateOfBirth"], props.messages.applications);
  const [pendingAction, setPendingAction] = useState<SectionSubmitAction>();
  const submit = async (values: PersonalDetailsData, action: SectionSubmitAction) => {
    errors.clear();
    try {
      await props.onPersist(values, action);
    } catch (error: unknown) {
      errors.present(error);
    }
  };
  const run = useFormSubmissionDispatcher(form, setPendingAction, submit);
  const fullNameError = fieldMessage(form.formState.errors.fullName, props.messages.applications.invalidNameError);
  const dateError = fieldMessage(form.formState.errors.dateOfBirth, props.messages.applications.invalidDateError);

  return (
    <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); run("save"); }} noValidate>
      <FormSummary applicationId={props.applicationId} localValidation={form.formState.isSubmitted && !form.formState.isValid} messages={props.messages.applications} summary={errors.summary} />
      <div className="space-y-2">
        <Label htmlFor="fullName">{props.messages.applications.fullName}</Label>
        <Input id="fullName" autoComplete="off" aria-invalid={Boolean(fullNameError)} aria-describedby="fullName-help fullName-error" {...form.register("fullName")} />
        <p id="fullName-help" className="text-sm leading-6 text-muted-foreground">{props.messages.applications.fullNameHelp}</p>
        {fullNameError ? <p id="fullName-error" className="text-sm font-bold text-error" role="alert">{fullNameError}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">{props.messages.applications.dateOfBirth}</Label>
        <Input id="dateOfBirth" type="date" aria-invalid={Boolean(dateError)} aria-describedby="dateOfBirth-help dateOfBirth-error" {...form.register("dateOfBirth")} />
        <p id="dateOfBirth-help" className="text-sm leading-6 text-muted-foreground">{props.messages.applications.dateOfBirthHelp}</p>
        {dateError ? <p id="dateOfBirth-error" className="text-sm font-bold text-error" role="alert">{dateError}</p> : null}
      </div>
      <FormActions form={form} pendingAction={pendingAction} run={run} messages={props.messages.applications} />
    </form>
  );
}

function AddressForm(props: SectionFormProps) {
  const parsed = addressDataSchema.safeParse(props.initialData);
  const form = useForm<AddressData>({
    resolver: zodResolver(addressDataSchema),
    defaultValues: parsed.success ? parsed.data : { district: "CENTRAL", postalCode: "" },
  });
  const errors = useSubmissionErrors(form, ["district", "postalCode"], props.messages.applications);
  const [pendingAction, setPendingAction] = useState<SectionSubmitAction>();
  const submit = async (values: AddressData, action: SectionSubmitAction) => {
    errors.clear();
    try {
      await props.onPersist(values, action);
    } catch (error: unknown) {
      errors.present(error);
    }
  };
  const run = useFormSubmissionDispatcher(form, setPendingAction, submit);
  const districtError = fieldMessage(form.formState.errors.district, props.messages.applications.validationError);
  const postalError = fieldMessage(form.formState.errors.postalCode, props.messages.applications.invalidPostalError);

  return (
    <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); run("save"); }} noValidate>
      <FormSummary applicationId={props.applicationId} localValidation={form.formState.isSubmitted && !form.formState.isValid} messages={props.messages.applications} summary={errors.summary} />
      <div className="space-y-2">
        <Label htmlFor="district">{props.messages.applications.district}</Label>
        <select id="district" className="min-h-11 w-full rounded-control border border-input bg-card px-3 py-2 text-base leading-7 text-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-55" aria-invalid={Boolean(districtError)} aria-describedby={districtError ? "district-error" : undefined} {...form.register("district")}>
          {districtValues.map((value) => <option key={value} value={value}>{districtLabels[props.locale][value]}</option>)}
        </select>
        {districtError ? <p id="district-error" className="text-sm font-bold text-error" role="alert">{districtError}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="postalCode">{props.messages.applications.postalCode}</Label>
        <Input id="postalCode" inputMode="numeric" maxLength={6} autoComplete="off" aria-invalid={Boolean(postalError)} aria-describedby="postalCode-help postalCode-error" {...form.register("postalCode")} />
        <p id="postalCode-help" className="text-sm leading-6 text-muted-foreground">{props.messages.applications.postalCodeHelp}</p>
        {postalError ? <p id="postalCode-error" className="text-sm font-bold text-error" role="alert">{postalError}</p> : null}
      </div>
      <FormActions form={form} pendingAction={pendingAction} run={run} messages={props.messages.applications} />
    </form>
  );
}

function ServiceDetailsForm(props: SectionFormProps) {
  const parsed = serviceDetailsDataSchema.safeParse(props.initialData);
  const form = useForm<ServiceDetailsData>({
    resolver: zodResolver(serviceDetailsDataSchema),
    defaultValues: parsed.success ? parsed.data : props.serviceKey === "PERMANENT_DRIVING_LICENCE"
      ? { vehicleClass: "LMV", learnerLicenceReference: "" }
      : { vehicleClass: "LMV" },
    shouldUnregister: true,
  });
  const errors = useSubmissionErrors(form, ["vehicleClass", "learnerLicenceReference"], props.messages.applications);
  const [pendingAction, setPendingAction] = useState<SectionSubmitAction>();
  const submit = async (values: ServiceDetailsData, action: SectionSubmitAction) => {
    errors.clear();
    try {
      await props.onPersist(values, action);
    } catch (error: unknown) {
      errors.present(error);
    }
  };
  const run = useFormSubmissionDispatcher(form, setPendingAction, submit);
  const learnerError = fieldMessage(form.formState.errors.learnerLicenceReference, props.messages.applications.invalidLearnerError);

  return (
    <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); run("save"); }} noValidate>
      <FormSummary applicationId={props.applicationId} localValidation={form.formState.isSubmitted && !form.formState.isValid} messages={props.messages.applications} summary={errors.summary} />
      <div className="space-y-2">
        <Label htmlFor="vehicleClass">{props.messages.applications.vehicleClass}</Label>
        <Input id="vehicleClass" readOnly {...form.register("vehicleClass")} />
      </div>
      {props.serviceKey === "PERMANENT_DRIVING_LICENCE" ? (
        <div className="space-y-2">
          <Label htmlFor="learnerLicenceReference">{props.messages.applications.learnerReference}</Label>
          <Input id="learnerLicenceReference" autoComplete="off" aria-invalid={Boolean(learnerError)} aria-describedby="learnerLicenceReference-help learnerLicenceReference-error" {...form.register("learnerLicenceReference")} />
          <p id="learnerLicenceReference-help" className="text-sm leading-6 text-muted-foreground">{props.messages.applications.learnerReferenceHelp}</p>
          {learnerError ? <p id="learnerLicenceReference-error" className="text-sm font-bold text-error" role="alert">{learnerError}</p> : null}
        </div>
      ) : null}
      <FormActions form={form} pendingAction={pendingAction} run={run} messages={props.messages.applications} />
    </form>
  );
}

function DeclarationForm(props: SectionFormProps) {
  const parsed = declarationFormSchema.safeParse(props.initialData);
  const form = useForm<DeclarationFormValues>({
    resolver: zodResolver(declarationFormSchema),
    defaultValues: parsed.success ? parsed.data : { accepted: false },
  });
  const errors = useSubmissionErrors(form, ["accepted"], props.messages.applications);
  const [pendingAction, setPendingAction] = useState<SectionSubmitAction>();
  const submit = async (values: DeclarationFormValues, action: SectionSubmitAction) => {
    errors.clear();
    try {
      if (!values.accepted) return;
      await props.onPersist({ accepted: true }, action);
    } catch (error: unknown) {
      errors.present(error);
    }
  };
  const run = useFormSubmissionDispatcher(form, setPendingAction, submit);
  const acceptedError = fieldMessage(form.formState.errors.accepted, props.messages.applications.declarationError);

  return (
    <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); run("save"); }} noValidate>
      <FormSummary applicationId={props.applicationId} localValidation={form.formState.isSubmitted && !form.formState.isValid} messages={props.messages.applications} summary={errors.summary} />
      <div className="space-y-2">
        <label className="flex min-h-11 items-start gap-3 leading-7" htmlFor="accepted">
          <input id="accepted" className="mt-1 size-5 shrink-0 accent-primary" type="checkbox" aria-invalid={Boolean(acceptedError)} aria-describedby="accepted-error" {...form.register("accepted")} />
          <span>{props.messages.applications.declarationLabel}</span>
        </label>
        {acceptedError ? <p id="accepted-error" className="text-sm font-bold text-error" role="alert">{acceptedError}</p> : null}
      </div>
      <FormActions form={form} pendingAction={pendingAction} run={run} messages={props.messages.applications} />
    </form>
  );
}

export function ApplicationSectionForm(props: SectionFormProps) {
  switch (props.sectionKey) {
    case "PERSONAL_DETAILS":
      return <PersonalDetailsForm {...props} />;
    case "ADDRESS":
      return <AddressForm {...props} />;
    case "SERVICE_DETAILS":
      return <ServiceDetailsForm {...props} />;
    case "DECLARATION":
      return <DeclarationForm {...props} />;
  }
}
