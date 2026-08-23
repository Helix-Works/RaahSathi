type PageHeaderProps = Readonly<{
  eyebrow?: string;
  title: string;
  description?: string;
}>;

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="max-w-3xl space-y-3">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className="text-3xl font-black leading-[1.08] tracking-[-0.035em] text-balance sm:text-4xl lg:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </header>
  );
}
