export const mockScenarios = ["normal"] as const;

export type MockScenario = (typeof mockScenarios)[number];

export const defaultMockScenario: MockScenario = "normal";
