import {
  createSolanaDevnet,
  createSolanaLocalnet,
  createSolanaMainnet,
  createSolanaTestnet,
} from "@wallet-ui/react-native-kit";
import { openBotCluster, type SolanaClusterChoice } from "./solana-mobile";

/** Build the kit cluster. Mainnet is only constructed when a URL is present. */
export function clusterFromChoice(choice: SolanaClusterChoice) {
  switch (choice.helper) {
    case "createSolanaMainnet":
      return createSolanaMainnet({ url: choice.url });
    case "createSolanaTestnet":
      return createSolanaTestnet({ url: choice.url });
    case "createSolanaLocalnet":
      return createSolanaLocalnet({ url: choice.url });
    case "createSolanaDevnet":
      return createSolanaDevnet({ url: choice.url });
  }
}

export function openBotSolanaCluster() {
  return clusterFromChoice(openBotCluster());
}
