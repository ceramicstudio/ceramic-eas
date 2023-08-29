"use client";

import {CeramicWrapper} from "../context";
import type { AppProps } from 'next/app'
import "../styles/styles.css";

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <CeramicWrapper>
      <Component {...pageProps} ceramic />
    </CeramicWrapper>
  );
}

export default MyApp