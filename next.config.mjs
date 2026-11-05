// Server Actions default to a 1 MB body limit; profile photos can be up to 2 MB.
const nextConfig = { experimental: { serverActions: { bodySizeLimit: "3mb" } } };
export default nextConfig;