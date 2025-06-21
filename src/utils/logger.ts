declare global {
  interface Window {
    electronAPI?: {
      logToMain?: (message: string, ...args: any[]) => void;
    };
  }
}

export function log(message: string) {
  console.log(`[LOG] ${message}`);

  // すべて文字列化して送信
  if (typeof window !== "undefined" && window.electronAPI?.logToMain) {
    window.electronAPI.logToMain(
      typeof message === "string" ? message : JSON.stringify(message),
    );
  }

}

export function logMethod(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  descriptor.value = function (...args: any[]) {
    log(`[LOG] ${propertyKey} start`);
    const result = originalMethod.apply(this, args);
    log(`[LOG] ${propertyKey} end`);
    return result;
  };
  return descriptor;
}
