export type DataSource = "real" | "mock";

export function resolveDataSource(
  configuredValue = process.env.NEXT_PUBLIC_DATA_SOURCE,
  nodeEnvironment = process.env.NODE_ENV,
): DataSource {
  const value = configuredValue ?? "real";

  if (value !== "real" && value !== "mock") {
    throw new Error(
      `Unsupported NEXT_PUBLIC_DATA_SOURCE value: ${JSON.stringify(value)}.`,
    );
  }

  if (nodeEnvironment === "production" && value === "mock") {
    throw new Error(
      "Mock frontend data is disabled in production. Set NEXT_PUBLIC_DATA_SOURCE=real.",
    );
  }

  return value;
}

export const dataSource = resolveDataSource();

export function selectDataSource<T>(sources: Readonly<Record<DataSource, T>>): T {
  return sources[dataSource];
}
