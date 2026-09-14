const nextConfig = {
  agentRules: false,
  output: 'standalone',
  poweredByHeader: false,
  serverExternalPackages: ['pg', '@electric-sql/pglite'],
  outputFileTracingIncludes: { '/*': ['./migrations/**/*.sql', './migrations/**/*.js'] },
};

export default nextConfig;