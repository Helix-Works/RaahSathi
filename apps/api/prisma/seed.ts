async function main() {
  console.info("No foundation seed data is defined yet.");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
