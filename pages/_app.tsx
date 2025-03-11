import type { AppProps } from 'next/app'
import '../styles/ai-helper.css'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
} 