import WalletConnectProvider from '@walletconnect/web3-provider'
import { providers } from 'ethers'
// import Head from 'next/head'
import { useCallback, useEffect, useReducer } from 'react'
import WalletLink from 'walletlink'
import Web3Modal from 'web3modal'
import { ellipseAddress, getChainData } from '../lib/utilities'

const INFURA_ID = '460f40a260564ac4a4f4b3fffb032dad'

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: INFURA_ID, // required
    },
  },
  'custom-walletlink': {
    display: {
      logo: 'https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0',
      name: 'Coinbase',
      description: 'Connect to Coinbase Wallet (not Coinbase App)',
    },
    options: {
      appName: 'Coinbase', // Your app name
      networkUrl: `https://mainnet.infura.io/v3/${INFURA_ID}`,
      chainId: 1,
    },
    package: WalletLink,
    connector: async (_, options) => {
      const { appName, networkUrl, chainId } = options
      const walletLink = new WalletLink({
        appName,
      })
      const provider = walletLink.makeWeb3Provider(networkUrl, chainId)
      await provider.enable()
      return provider
    },
  },
}

let web3Modal
if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    network: 'mainnet', // optional
    cacheProvider: true,
    providerOptions, // required
  })
}

type StateType = {
  provider?: any
  web3Provider?: any
  address?: string
  chainId?: number
}

type ActionType =
  | {
    type: 'SET_WEB3_PROVIDER'
    provider?: StateType['provider']
    web3Provider?: StateType['web3Provider']
    address?: StateType['address']
    chainId?: StateType['chainId']
  }
  | {
    type: 'SET_ADDRESS'
    address?: StateType['address']
  }
  | {
    type: 'SET_CHAIN_ID'
    chainId?: StateType['chainId']
  }
  | {
    type: 'RESET_WEB3_PROVIDER'
  }

const initialState: StateType = {
  provider: null,
  web3Provider: null,
  address: '0x73e1d93414eae84cf06877cAe50B0C310EaCE5C8',
  chainId: 56,
}

function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case 'SET_WEB3_PROVIDER':
      return {
        ...state,
        provider: action.provider,
        web3Provider: action.web3Provider,
        address: action.address,
        chainId: action.chainId,
      }
    case 'SET_ADDRESS':
      return {
        ...state,
        address: action.address,
      }
    case 'SET_CHAIN_ID':
      return {
        ...state,
        chainId: action.chainId,
      }
    case 'RESET_WEB3_PROVIDER':
      return initialState
    default:
      throw new Error()
  }
}

export const MainPage = (): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { provider, address, chainId } = state
  // web3Provider
  const connect = useCallback(async function () {
    // This is the initial `provider` that is returned when
    // using web3Modal to connect. Can be MetaMask or WalletConnect.
    const provider = await web3Modal.connect()

    // We plug the initial `provider` into ethers.js and get back
    // a Web3Provider. This will add on methods from ethers.js and
    // event listeners such as `.on()` will be different.
    const web3Provider = new providers.Web3Provider(provider)

    const signer = web3Provider.getSigner()
    const address = await signer.getAddress()

    const network = await web3Provider.getNetwork()

    dispatch({
      type: 'SET_WEB3_PROVIDER',
      provider,
      web3Provider,
      address,
      chainId: network.chainId,
    })
  }, [])

  const disconnect = useCallback(
    async function () {
      await web3Modal.clearCachedProvider()
      if (provider?.disconnect && typeof provider.disconnect === 'function') {
        await provider.disconnect()
      }
      dispatch({
        type: 'RESET_WEB3_PROVIDER',
      })
    },
    [provider]
  )

  // Auto connect to the cached provider
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connect()
    }
  }, [connect])

  // A `provider` should come with EIP-1193 events. We'll listen for those events
  // here so that when a user switches accounts or networks, we can update the
  // local React state with that new information.
  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        // eslint-disable-next-line no-console
        console.log('accountsChanged', accounts)
        dispatch({
          type: 'SET_ADDRESS',
          address: accounts[0],
        })
      }

      // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
      const handleChainChanged = (_hexChainId: string) => {
        window.location.reload()
      }

      const handleDisconnect = (error: { code: number; message: string }) => {
        // eslint-disable-next-line no-console
        console.log('disconnect', error)
        disconnect()
      }

      provider.on('accountsChanged', handleAccountsChanged)
      provider.on('chainChanged', handleChainChanged)
      provider.on('disconnect', handleDisconnect)

      // Subscription Cleanup
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged)
          provider.removeListener('chainChanged', handleChainChanged)
          provider.removeListener('disconnect', handleDisconnect)
        }
      }
    }
  }, [provider, disconnect])

  const chainData = getChainData(chainId)

  return (
    <div className="main-wrapper">
      <header className="header">

        <div className="header_hidden">
          {address && (
            <div className="grid">
              <div>
                <p className="mb-1">Network:</p>
                <p>{chainData?.name}</p>
              </div>
              <div>
                <p className="mb-1">Address:</p>
                <p>{ellipseAddress(address)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="container">
          <div className="header__body">
            <div className="header__item">
              <a href="/">
                <img
                  className="logo"
                  width={380}
                  height={80}
                  src="/img/logo.svg"
                  alt="лого"
                />
              </a>
            </div>
            <div className="header__item">
              <a href="#" className="btn">
                <img src="/img/pank.svg" />
                <span>Buy TPAD</span>
              </a>
              <button className="btn" onClick={connect}>
                <span>Connect Wallet</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="container">
          <div className="pad">
            <div className="pad__item pad-aside">
              <div className="pad-aside__header">
                <img src="/img/crypto-logo.jpg" className="br50" />
                <div>
                  <h1>SHUMI</h1>
                  <img src="/img/open.svg" />
                </div>
              </div>
              <div className="pad-aside__join">
                <button className="btn" onClick={connect}>
                  <span>Connect Wallet</span>
                </button>
              </div>
              <div className="pad-aside__progress">
                <h3 className="pad-aside__h3">Получи: до 30.000.000 SHUMI</h3>
                <div className="progress">
                  <div className="progress__top">
                    <span>airdrop закрывается 0 - 2 часа</span>
                    <span className="js-procent">90.60%</span>
                  </div>
                  <div className="progress__bar">
                    <div className="progress__bar_progress" />
                  </div>
                  <div className="progress__bot">
                    9 060 000 000 000 / 10 000 000 000 000 SHUMI
                  </div>
                </div>
                <div className="airdrop">
                  <div className="airdrop__row">
                    <div className="airdrop__item">💰 Airdrop</div>
                    <div className="airdrop__item">От 5 до 30 млрд. SHUMI.</div>
                  </div>
                  <div className="airdrop__row">
                    <div className="airdrop__item">🏃‍♂ Важно</div>
                    <div className="airdrop__item">
                      В Airdrop можно участвовать единожды. При повторном
                      подключении, токены начислены не будут.
                    </div>
                  </div>
                  <div className="airdrop__row">
                    <div className="airdrop__item">🔥 Время начисления</div>
                    <div className="airdrop__item">
                      Начисление токенов происходит автоматический в течении 12
                      часов.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pad__item pad-main">
              <div className="pad-main__header">
                <img src="/img/crypto-logo.jpg" className="br50" />
                <h3>SHUMI</h3>
              </div>
              <p className="pad-main__p">
                Первичная раздача токенов SHUMI на площадке Etherpadium.
                Автоматическое начисление токенов на ваш баланс. Раздача 3 млрд
                токенов SHUMI проходит в течении 24 часов.
              </p>
              <img className="pad-main__img" src="/img/crypto-banner.jpg" />
              <div className="social">
                <a href="#">
                  <img src="/img/social/tg.svg" />
                </a>
                <a href="#">
                  <img src="/img/social/tw.svg" />
                </a>
                <a href="#">
                  <img src="/img/social/web.svg" />
                </a>
              </div>
              <div className="pad-main__txt">
                <h4>токен</h4>
                <ul className="pad-main__ul">
                  <li>
                    <span>Токен:</span>
                    <span className="active-color">SHUMI </span>
                  </li>
                  <li>
                    <span>Сеть: </span>
                    <span>Binance Smart Chain (BEP20) </span>
                  </li>
                  <li>
                    <span>Общее предложение: </span>
                    <span>Эмиссия - 21 млрд. </span>
                  </li>
                  <li>
                    <span>Цена при листинге: </span>
                    <span className="active-color">
                      0.00000000066 BNB или 0,00000018 USDT за 1 токен.{' '}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* <h1 className="title">Web3Modal Example</h1>
        {web3Provider ? (
          <button className="button" type="button" onClick={disconnect}>
            Disconnect
          </button>
        ) : (
          <button className="button" type="button" onClick={connect}>
            Connect
          </button>
        )} */}
      </main>
      <footer className="footer">
        <div className="container">
          <div className="footer__top">
            <h2>Want to launch your project on MultiChain?</h2>
            <a href="#" className="btn">
              <img src="/img/rocket.png" />
              <span> Apply to Launch</span>
            </a>
          </div>
          <div className="footer__body">
            <div className="footer__item">
              Participants/Citizens from the following countries are strictly
              excluded/not allowed to participate in the IDOs: Bolivia,
              Cambodia, Iran, Iraq, Libya, Nepal, Zimbabwe, Liberia, Myanmar,
              North Korea.
            </div>
            <div className="footer__item">
              © Copyright MultiChain 2022. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
