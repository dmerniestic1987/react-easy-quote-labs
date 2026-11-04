/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // MUI and Emotion are bundled together on the server so they share ONE copy of Emotion. Otherwise the server
  // ignores the Emotion cache of `_app` and renders `css-` class names, which causes a hydration warning.
  transpilePackages: [
    '@mui/material',
    '@mui/system',
    '@mui/styled-engine',
    '@mui/x-data-grid',
    '@mui/icons-material',
    '@emotion/react',
    '@emotion/styled',
    '@emotion/cache',
  ],
  // Phone on the local network (see `npm run dev:https`). Update it if the router changes the IP of the computer.
  allowedDevOrigins: ['192.168.0.85'],
};
