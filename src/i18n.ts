import ja from "./locales/ja.json";
import en from "./locales/en.json";

const resources: Record<"ja" | "en", Record<string, string>> = { ja, en };
let currentLang: "ja" | "en" = "ja";

export function setLang(lang: "ja" | "en") {
  currentLang = lang;
}

// export function str(key: string): string {
//   return resources[currentLang][key] || key;
// }

/**
 * message format function
 * @param key message id
 * @param params interpolation parameters
 * @returns formatted message
 * @example
 * strf("greeting", { name: "Alice" }) // "Hello, Alice!"
 */
export function str(key: string, params?: Record<string, string | number>): string {
  let text = resources[currentLang][key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}
