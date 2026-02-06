import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import baseConfig from "./base.js";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const nextConfig = compat.extends("next/core-web-vitals", "next/typescript");

export default [...baseConfig, ...nextConfig];
