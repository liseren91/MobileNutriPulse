import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nutripulse.mobile",
  appName: "NutriPulse",
  webDir: "dist",
  server: {
    iosScheme: "capacitor",
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
