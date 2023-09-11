"use client";

import type { AppProps } from 'next/app'
import "../styles/styles.css";

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
      <Component {...pageProps} ceramic />
  );
}

export default MyApp