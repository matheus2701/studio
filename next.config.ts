
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'genkit', 
    '@genkit-ai/googleai', 
    '@genkit-ai/next',
    '@genkit-ai/google-genai'
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
