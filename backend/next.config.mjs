const nextConfig = {
  agentRules: false,
  output: 'standalone',
  poweredByHeader: false,
  serverExternalPackages: ['pg', '@electric-sql/pglite'],
  outputFileTracingIncludes: { '/*': ['./migrations/**/*.sql'] },
};

export default nextConfig;