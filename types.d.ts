/**
 * Type definitions for l1beat-l1-registry
 */

export interface Social {
  /** Social platform name (e.g., "twitter", "discord", "telegram") */
  name: string;
  /** URL to the social media profile or invite */
  url: string;
}

export interface NativeToken {
  /** Token ticker symbol (e.g., "AVAX", "BEAM") */
  symbol: string;
  /** Full token name */
  name: string;
  /** Number of decimal places the token uses */
  decimals: number;
  /** URL to the token logo image */
  logoUri?: string;
}

export interface Blockchain {
  /** Unique Avalanche blockchain identifier */
  blockchainId: string;
  /** Human-readable blockchain name */
  name: string;
  /** Description of the blockchain */
  description?: string;
  /** EVM-compatible chain ID (EIP-155) */
  evmChainId: number;
  /** Virtual machine name (e.g., "EVM", "SubnetEVM") */
  vmName: string;
  /** Virtual machine identifier */
  vmId: string;
  /** Consensus mechanism type */
  sybilResistanceType?: "Proof of Stake" | "Proof of Authority";
  /** Block explorer URL */
  explorerUrl?: string;
  /** Array of JSON-RPC endpoint URLs */
  rpcUrls: string[];
  /** Native gas/utility token of the blockchain */
  nativeToken?: NativeToken;
}

export interface ChainData {
  /** Unique Avalanche subnet identifier */
  subnetId: string;
  /** Whether this subnet has been converted to an L1 */
  isL1?: boolean;
  /** Network environment */
  network: "mainnet" | "fuji";
  /** Classification categories (uppercase, e.g., "DEFI", "GAMING") */
  categories: string[];
  /** Official chain name */
  name: string;
  /** Brief description of the chain */
  description: string;
  /** URL to the chain's logo image */
  logo: string;
  /** Official website URL */
  website: string;
  /** Social media links */
  socials: Social[];
  /** Blockchains within this subnet */
  chains: Blockchain[];
}

/** Absolute path to the data directory */
export const dataPath: string;

/** Get the data directory path for l1-registry */
export function getDataPath(): string;

/**
 * Load a single chain by folder name
 * @param chainFolder - Chain folder name (e.g., "dexalot", "beam")
 * @returns Chain metadata object or null if not found
 */
export function loadChain(chainFolder: string): ChainData | null;

/**
 * Load all available chains
 * @returns Array of chain metadata objects
 */
export function getAllChains(): ChainData[];

/**
 * Get list of all chain folder names
 * @returns Array of chain folder names
 */
export function getChainNames(): string[];
