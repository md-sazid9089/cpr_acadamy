const nextConfig = {
  agentRules: false,
  // The Docker image runs the standalone server; Vercel packages the app its own way.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  poweredByHeader: false,
  serverExternalPackages: ['pg', '@electric-sql/pglite'],
  outputFileTracingIncludes: { '/*': ['./migrations/**/*.sql', './migrations/**/*.js'] },
};

export default nextConfig;
