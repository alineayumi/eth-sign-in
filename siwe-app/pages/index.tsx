import type { NextPage } from "next";
import { FC, useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SiweMessage } from "siwe";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useEnsName,
  useNetwork,
  useSignMessage,
} from "wagmi";

const Home: NextPage = () => {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { signMessageAsync } = useSignMessage();
  const [state, setState] = useState<{
    address?: string;
    message?: string;
    error?: Error;
    loading?: boolean;
  }>({});

  useEffect(() => {
    const handler = async () => {
      try {
        const res = await fetch("api/me");
        const { address } = await res.json();
        setState((x) => ({ ...x, address }));
      } catch (error) {
        console.log(error);
      }
    };

    handler();
    window.addEventListener("focus", handler);

    return () => window.removeEventListener("focus", handler);
  }, []);

  const signIn = async () => {
    try {
      setState((x) => ({ ...x, loading: true }));
      const nonceRes = await fetch("/api/nonce");
      const nonce = await nonceRes.text();
      const chainId = chain?.id;

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to the app.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });

      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      const verifyRes = await fetch("api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, signature }),
      });

      if (!verifyRes.ok)
        return alert("There was an error verifying your signature.");

      setState((x) => ({ ...x, address, loading: false }));

      // @ts-expect-error
    } catch (error: Error) {
      setState((x) => ({ ...x, error }));
    }
  };

  const signOut = async () => {
    const res = await fetch("/api/logout", {
      method: "GET",
    });
    setState({});
  };

  return (
    <div className="py-6 justify-center text-center">
      <div className="flex justify-center">
        <ConnectButton />
      </div>

      {state.address ? (
        <div>
          <p className="mt-10">You are signed in as {state.address}</p>
          <button
            onClick={signOut}
            className="m-10 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-blue-300"
          >
            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0">
              Sign out
            </span>
          </button>
        </div>
      ) : (
        <button
          onClick={signIn}
          className="m-10 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-blue-300"
        >
          <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0">
            Sign in with Ethereum
          </span>
        </button>
      )}

      <InfoSection />
    </div>
  );
};

const InfoSection: FC = () => {
  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold">If you need help</h2>
      <div className="flex flex-col gap-2 mt-2">
        <a
          href="https://wagmi.sh"
          target="_blank"
          className="underline text-gray-600"
        >
          Link to wagmi docs
        </a>
        <a
          href="https://github.com/dhaiwat10/create-web3-frontend"
          target="_blank"
          className="underline text-gray-600"
        >
          Open an issue on Github
        </a>
      </div>
    </div>
  );
};

export default Home;
