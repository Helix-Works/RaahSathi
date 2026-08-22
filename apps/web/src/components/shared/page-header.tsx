type PageHeaderProps = Readonly<{
  eyebrow?: string;
  title: string;
  description?: string;
}>;

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="max-w-3xl space-y-4">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className="text-4xl font-black tracking-[-0.045em] text-balance sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
      ) : null}
    </header>
  );
}
