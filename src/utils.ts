export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export class Timer {
  private startTime: number | undefined = 0;

  start() {
    this.startTime = performance.now();
  }

  stop(label: string = "duration") {
    if (!this.startTime) {
      throw new Error("Timer not started. `Call start()` first.");
    }
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    console.log(`[${label}]: ${duration.toFixed(3)}ms`);
    this.startTime = undefined;
  }
}
