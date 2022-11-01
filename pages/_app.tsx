import { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/styles.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head children={<title>Etherpadium</title>}></Head>
      <Component {...pageProps} />
    </>
  )
}
