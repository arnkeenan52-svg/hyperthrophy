import withPWAInit from "@ducanh2912/next-pwa";

// CAP=1 builds a static export for the Capacitor (iOS) wrapper.
const isCapacitor = process.env.CAP === "1";

const withPWA = withPWAInit({
  dest: "public",
  // Service worker is unnecessary (and conflicts with capacitor://) in the native shell.
  disable: process.env.NODE_ENV === "development" || isCapacitor,
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isCapacitor ? { output: "export", images: { unoptimized: true } } : {}),
};

export default withPWA(nextConfig);
