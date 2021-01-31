import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";
import "antd/dist/antd.css";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import "./App.css";
import { Row, Col, Button, Menu, List, Progress, Divider, Slider } from "antd";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { useUserAddress } from "eth-hooks";
import {
  useExchangePrice,
  useGasPrice,
  useUserProvider,
  useContractLoader,
  useContractReader,
  useEventListener,
  useBalance,
  useExternalContractLoader,
} from "./hooks";
import { Header, Account, Faucet, Ramp, Contract, GasGauge, Balance, Address } from "./components";
import { Transactor } from "./helpers";
import { formatEther, parseEther } from "@ethersproject/units";
import { Hints, ExampleUI, Subgraph, Countdown } from "./views";

/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/austintgriffith/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    📡 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/
import { INFURA_ID, DAI_ADDRESS, DAI_ABI } from "./constants";
const humanizeDuration = require("humanize-duration");

// 😬 Sorry for all the console logging 🤡
const DEBUG = true;

// 🔭 block explorer URL
const blockExplorer = "https://etherscan.io/"; // for xdai: "https://blockscout.com/poa/xdai/"

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
//const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
const mainnetProvider = new JsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID);
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_ID)
console.log("window.location.hostname", window.location.hostname);
// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = "http://" + window.location.hostname + ":8545"; // for xdai: https://dai.poa.network
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new JsonRpcProvider(localProviderUrlFromEnv);

function App(props) {
  const [injectedProvider, setInjectedProvider] = useState();
  /* 💵 this hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(mainnetProvider); //1 for xdai

  /* 🔥 this hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice("fast"); //1000000000 for xdai

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProvider = useUserProvider(injectedProvider, localProvider);
  const address = useUserAddress(userProvider);

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userProvider, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);
  if (DEBUG) console.log("💵 yourLocalBalance", yourLocalBalance ? formatEther(yourLocalBalance) : "...");

  // just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);
  if (DEBUG) console.log("💵 yourMainnetBalance", yourMainnetBalance ? formatEther(yourMainnetBalance) : "...");

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider);
  if (DEBUG) console.log("📝 readContracts", readContracts);

  // If you want to make 🔐 write transactions to your contracts, use the userProvider:
  const writeContracts = useContractLoader(userProvider);
  if (DEBUG) console.log("🔐 writeContracts", writeContracts);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  //const mainnetDAIContract = useExternalContractLoader(mainnetProvider, DAI_ADDRESS, DAI_ABI)
  //console.log("🥇DAI contract on mainnet:",mainnetDAIContract)
  //
  // Then read your DAI balance like:
  //const myMainnetBalance = useContractReader({DAI: mainnetDAIContract},"DAI", "balanceOf",["0x34aA3F359A9D614239015126635CE7732c18fDF3"])
  //

  //keep track of contract balance to know how much has been staked total:
  const stakerContractBalance = useBalance(localProvider, readContracts && readContracts.Staker.address);
  if (DEBUG) console.log("💵 stakerContractBalance", stakerContractBalance);

  //keep track of total 'threshold' needed of ETH
  const threshold = useContractReader(readContracts, "Staker", "threshold");
  console.log("💵 threshold:", threshold);

  // keep track of a variable from the contract in the local React state:
  const balanceStaked = useContractReader(readContracts, "Staker", "balances", [address]);
  console.log("💸 balanceStaked:", balanceStaked);

  //📟 Listen for broadcast events
  const stakeEvents = useEventListener(readContracts, "Staker", "Stake", localProvider, 1);
  console.log("📟 stake events:", stakeEvents);

  // keep track of a variable from the contract in the local React state:

  const timeLeft = useContractReader(readContracts, "Staker", "timeLeft");
  console.log("⏳ timeLeft:", timeLeft);

  const complete = useContractReader(readContracts, "ExampleExternalContract", "completed");
  console.log("✅ complete:", complete);

  const exampleExternalContractBalance = useBalance(
    localProvider,
    readContracts && readContracts.ExampleExternalContract.address,
  );
  if (DEBUG) console.log("💵 exampleExternalContractBalance", exampleExternalContractBalance);

  let completeDisplay = "";
  if (complete) {
    completeDisplay = (
      <div style={{ padding: 64, backgroundColor: "#244166", fontWeight: "bolder" }}>
        🚀 🎖 👩‍🚀 - Staking App triggered `ExampleExternalContract` -- 🎉 🍾 🎊
        <Balance balance={exampleExternalContractBalance} fontSize={64} /> ETH staked!
      </div>
    );
  }

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new Web3Provider(provider));
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  let faucetHint = "";
  const [faucetClicked, setFaucetClicked] = useState(false);
  if (
    !faucetClicked &&
    localProvider &&
    localProvider.getSigner() &&
    yourLocalBalance &&
    formatEther(yourLocalBalance) <= 0
  ) {
    faucetHint = (
      <div style={{ padding: 16 }}>
        <Button
          type={"primary"}
          onClick={() => {
            faucetTx({
              to: address,
              value: parseEther("0.01"),
            });
            setFaucetClicked(true);
          }}
        >
          💰 Grab funds from the faucet ⛽️
        </Button>
      </div>
    );
  }

  const [EthToStakeValue, setEthToStakeValue] = useState("0.1");

  const sliderOnChange = value => {
    if (value === 0) {
      setEthToStakeValue("0.01");
    } else if (value === 50) {
      setEthToStakeValue("0.1");
    } else if (value === 100) {
      setEthToStakeValue("1.0");
    } else {
      console.log("Slider: something went wrong");
    }
  };

  const marks = {
    0: "0.01",
    50: "0.10",
    100: "1.00",
  };

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header />

      <BrowserRouter>
        {/* <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
          <Menu.Item key="/">
            <Link
              onClick={() => {
                setRoute("/");
              }}
              to="/"
            >
              Staker UI
            </Link>
          </Menu.Item>
          <Menu.Item key="/contracts">
            <Link
              onClick={() => {
                setRoute("/contracts");
              }}
              to="/contracts"
            >
              Debug Contracts
            </Link>
          </Menu.Item>
        </Menu> */}

        <Switch>
          <Route exact path="/">
            {completeDisplay}

            <div style={{ marginTop: 15, zoom: 0.8 }}>
              {/* <div>Timeleft:</div> */}
              {/* {timeLeft && humanizeDuration(timeLeft.toNumber() * 1000)} */}

              {timeLeft && (
                <Countdown
                  timeLeft={timeLeft}
                  complete={complete}
                  // countdownData={humanizeDuration(timeLeft.toNumber() * 1000, {
                  //   units: ["y", "mo", "d", "h", "m", "s"],
                  //   round: true,
                  // })
                  //   .split(",")
                  //   .map(e => e.trim())}
                />
              )}
            </div>

            <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }} style={{ margin: "0 25px" }}>
              <Col xs={24} xl={8}>
                <div className="box-middle">
                  <h2 className="heading2">STATS</h2>
                  <div className="box-inner">
                    <p style={{ color: "#a5adc6" }}>TOTAL STAKED</p>
                    <Progress
                      type="circle"
                      strokeColor={{
                        "0%": "#108ee9",
                        "100%": "#87d068",
                      }}
                      percent={complete ? 100 : (stakerContractBalance / threshold) * 100}
                      style={{ marginTop: "10px" }}
                    />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Balance balance={stakerContractBalance} fontSize={64} />
                      <svg width="15" height="20" viewBox="0 0 10 14" fill="none">
                        <path
                          d="M4.99835 0.333496V5.26076L9.16292 7.12168L4.99835 0.333496Z"
                          fill="white"
                          fill-opacity="0.7"
                        ></path>
                        <path d="M4.99837 0.333496L0.833252 7.12168L4.99837 5.26076V0.333496Z" fill="white"></path>
                        <path
                          d="M4.99835 10.3147V13.6627L9.1657 7.89717L4.99835 10.3147Z"
                          fill="white"
                          fill-opacity="0.7"
                        ></path>
                        <path d="M4.99837 13.6627V10.3141L0.833252 7.89717L4.99837 13.6627Z" fill="white"></path>
                        <path
                          d="M4.99835 9.53976L9.16292 7.12168L4.99835 5.26187V9.53976Z"
                          fill="white"
                          fill-opacity="0.4"
                        ></path>
                        <path
                          d="M0.833252 7.12168L4.99837 9.53976V5.26187L0.833252 7.12168Z"
                          fill="white"
                          fill-opacity="0.7"
                        ></path>
                      </svg>
                    </div>
                    <Divider style={{ backgroundColor: "#a6b1e1", margin: "10px 0" }}></Divider>
                    <p style={{ color: "#a5adc6" }}>GOAL</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Balance balance={threshold} fontSize={64} />
                      <svg width="15" height="20" viewBox="0 0 10 14" fill="none">
                        <path
                          d="M4.99835 0.333496V5.26076L9.16292 7.12168L4.99835 0.333496Z"
                          fill="white"
                          fill-opacity="0.7"
                        ></path>
                        <path d="M4.99837 0.333496L0.833252 7.12168L4.99837 5.26076V0.333496Z" fill="white"></path>
                        <path
                          d="M4.99835 10.3147V13.6627L9.1657 7.89717L4.99835 10.3147Z"
                          fill="white"
                          fill-opacity="0.7"
                        ></path>
                        <path d="M4.99837 13.6627V10.3141L0.833252 7.89717L4.99837 13.6627Z" fill="white"></path>
                        <path
                          d="M4.99835 9.53976L9.16292 7.12168L4.99835 5.26187V9.53976Z"
                          fill="white"
                          fill-opacity="0.4"
                        ></path>
                        <path
                          d="M0.833252 7.12168L4.99837 9.53976V5.26187L0.833252 7.12168Z"
                          fill="white"
                          fill-opacity="0.7"
                        ></path>
                      </svg>
                    </div>

                    <div style={{ padding: 8 }}>
                      <button
                        className={
                          complete
                            ? "disabled-button"
                            : (stakerContractBalance / threshold) * 100 < 100
                            ? "disabled-button"
                            : timeLeft > 0
                            ? "blue-button"
                            : "disabled-button"
                        }
                        type={"default"}
                        onClick={() => {
                          tx(writeContracts.Staker.execute());
                        }}
                      >
                        Execute!
                      </button>
                    </div>
                  </div>
                </div>
              </Col>
              <Col xs={24} xl={8}>
                <div className="box-middle">
                  <h2 className="heading2">DASHBOARD</h2>
                  <div className="box-inner">
                    <p style={{ color: "#a5adc6" }}>MY STAKE</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Balance balance={balanceStaked} fontSize={64} />
                      <svg width="15" height="20" viewBox="0 0 10 14" fill="none">
                        <path
                          d="M4.99835 0.333496V5.26076L9.16292 7.12168L4.99835 0.333496Z"
                          fill="white"
                          fill-opacity="0.7"
                        ></path>
                        <path d="M4.99837 0.333496L0.833252 7.12168L4.99837 5.26076V0.333496Z" fill="white"></path>
                        <path
                          d="M4.99835 10.3147V13.6627L9.1657 7.89717L4.99835 10.3147Z"
                          fill="white"
                          fill-opacity="0.7"
                        ></path>
                        <path d="M4.99837 13.6627V10.3141L0.833252 7.89717L4.99837 13.6627Z" fill="white"></path>
                        <path
                          d="M4.99835 9.53976L9.16292 7.12168L4.99835 5.26187V9.53976Z"
                          fill="white"
                          fill-opacity="0.4"
                        ></path>
                        <path
                          d="M0.833252 7.12168L4.99837 9.53976V5.26187L0.833252 7.12168Z"
                          fill="white"
                          fill-opacity="0.7"
                        ></path>
                      </svg>
                    </div>
                    <div style={{ padding: 8 }}>
                      <button
                        className={
                          timeLeft > 0
                            ? "disabled-button"
                            : complete
                            ? "disabled-button"
                            : balanceStaked > 0
                            ? "blue-button"
                            : "disabled-button"
                        }
                        type={"default"}
                        onClick={() => {
                          tx(writeContracts.Staker.withdraw());
                        }}
                      >
                        Withdraw
                      </button>
                    </div>
                    <Divider style={{ backgroundColor: "#a6b1e1", margin: "30px 0" }}></Divider>
                    <p style={{ color: "#a5adc6" }}>STAKE ETHER</p>
                    <div style={{ padding: 8 }}>
                      <Slider
                        marks={marks}
                        step={null}
                        defaultValue={37}
                        dots
                        onChange={sliderOnChange}
                        style={{ marginBottom: "45px" }}
                      />
                      <button
                        className={timeLeft <= 0 ? "disabled-button" : complete ? "disabled-button" : "blue-button"}
                        type={balanceStaked ? "success" : "primary"}
                        onClick={() => {
                          tx(writeContracts.Staker.stake({ value: parseEther(EthToStakeValue) }));
                        }}
                      >
                        Stake
                      </button>
                    </div>
                  </div>
                </div>
              </Col>
              <Col xs={24} xl={8}>
                <div className="box-middle">
                  <h2 className="heading2">HISTORY</h2>
                  <div className="box-inner">
                    <List
                      style={{ overflow: "auto", height: "350px" }}
                      locale={{ emptyText: "No transactions yet!" }}
                      size={"small"}
                      dataSource={stakeEvents}
                      renderItem={item => {
                        return (
                          <List.Item
                            key={item[0] + item[1] + item.blockNumber}
                            style={{
                              color: "rgb(230 230 230)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Address value={item[0]} ensProvider={mainnetProvider} fontSize={16} /> =>
                            <Balance balance={item[1]} />{" "}
                            <svg width="15" height="20" viewBox="0 0 10 14" fill="none">
                              <path
                                d="M4.99835 0.333496V5.26076L9.16292 7.12168L4.99835 0.333496Z"
                                fill="white"
                                fill-opacity="0.7"
                              ></path>
                              <path
                                d="M4.99837 0.333496L0.833252 7.12168L4.99837 5.26076V0.333496Z"
                                fill="white"
                              ></path>
                              <path
                                d="M4.99835 10.3147V13.6627L9.1657 7.89717L4.99835 10.3147Z"
                                fill="white"
                                fill-opacity="0.7"
                              ></path>
                              <path d="M4.99837 13.6627V10.3141L0.833252 7.89717L4.99837 13.6627Z" fill="white"></path>
                              <path
                                d="M4.99835 9.53976L9.16292 7.12168L4.99835 5.26187V9.53976Z"
                                fill="white"
                                fill-opacity="0.4"
                              ></path>
                              <path
                                d="M0.833252 7.12168L4.99837 9.53976V5.26187L0.833252 7.12168Z"
                                fill="white"
                                fill-opacity="0.7"
                              ></path>
                            </svg>
                          </List.Item>
                        );
                      }}
                    />
                  </div>
                </div>
              </Col>
            </Row>

            {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}

            {/* Uncomment to display and interact with an external contract (DAI on mainnet):
            <Contract
              name="DAI"
              customContract={mainnetDAIContract}
              signer={userProvider.getSigner()}
              provider={mainnetProvider}
              address={address}
              blockExplorer={blockExplorer}
            />
            */}
          </Route>
          <Route path="/contracts">
            <Contract
              name="Staker"
              signer={userProvider.getSigner()}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
            />
            <Contract
              name="ExampleExternalContract"
              signer={userProvider.getSigner()}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
            />
          </Route>
        </Switch>
      </BrowserRouter>

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <Account
          address={address}
          localProvider={localProvider}
          userProvider={userProvider}
          mainnetProvider={mainnetProvider}
          price={price}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
        />
        {faucetHint}
      </div>

      <div style={{ marginTop: 32, opacity: 0.5 }}>
        Created by{" "}
        <Address value={"0x3b322c58629702b4b1818418dad614a1d9e137c2"} ensProvider={mainnetProvider} fontSize={16} />
      </div>

      <div style={{ marginTop: 32, opacity: 0.5 }}>
        <a
          target="_blank"
          style={{ padding: 32, color: "#000" }}
          href="https://github.com/austintgriffith/scaffold-eth"
        >
          🍴 Fork me!
        </a>
      </div>

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[4, 4]}>
          <Col span={8}>
            <Ramp price={price} address={address} />
          </Col>

          <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
              size="large"
              shape="round"
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Col>
        </Row>

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {
              /*  if the local provider has a signer, let's show the faucet:  */
              localProvider &&
              localProvider.connection &&
              localProvider.connection.url &&
              localProvider.connection.url.indexOf(window.location.hostname) >= 0 &&
              !process.env.REACT_APP_PROVIDER &&
              price > 1 ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )
            }
          </Col>
        </Row>
      </div>
    </div>
  );
}

/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  setTimeout(() => {
    window.location.reload();
  }, 1);
};

export default App;
