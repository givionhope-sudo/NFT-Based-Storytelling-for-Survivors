import { describe, it, expect, beforeEach } from "vitest";
import { stringUtf8CV, uintCV, stringAsciiCV, buffCV, optionalCV, tupleCV, boolCV, listCV, principalCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_TOKEN_ID = 101;
const ERR_INVALID_METADATA = 102;
const ERR_INVALID_ROYALTY_RATE = 103;
const ERR_INVALID_RECOVERY_MILESTONE = 104;
const ERR_TOKEN_ALREADY_EXISTS = 105;
const ERR_TOKEN_NOT_FOUND = 106;
const ERR_INVALID_TIMESTAMP = 107;
const ERR_INVALID_OWNER = 108;
const ERR_INVALID_STORY_HASH = 109;
const ERR_INVALID_ART_URI = 110;
const ERR_INVALID_RECOVERY_GOAL = 111;
const ERR_MAX_TOKENS_EXCEEDED = 112;
const ERR_INVALID_UPDATE_PARAM = 113;
const ERR_ROYALTY_NOT_SET = 114;
const ERR_INVALID_MILESTONE_COUNT = 115;
const ERR_INVALID_STATUS = 116;
const ERR_INVALID_CURRENCY = 117;
const ERR_INVALID_LOCATION = 118;
const ERR_INVALID_GROUP_ID = 119;
const ERR_INVALID_VERIFIER = 120;

interface Token {
  owner: string;
  storyHash: Uint8Array;
  artUri: string;
  metadata: string;
  recoveryGoal: string;
  milestoneCount: number;
  timestamp: number;
  status: boolean;
  currency: string;
  location: string;
  groupId: number | null;
}

interface TokenRoyalty {
  rate: number;
  beneficiary: string;
}

interface TokenMilestone {
  description: string;
  achieved: boolean;
  timestamp: number;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class StoryNFTMock {
  state: {
    nextTokenId: number;
    maxTokens: number;
    mintFee: number;
    royaltyRate: number;
    verifierContract: string | null;
    tokens: Map<number, Token>;
    tokenRoyalties: Map<number, TokenRoyalty>;
    tokenMilestones: Map<string, TokenMilestone>;
    tokensByOwner: Map<string, number[]>;
  } = {
    nextTokenId: 0,
    maxTokens: 10000,
    mintFee: 500,
    royaltyRate: 10,
    verifierContract: null,
    tokens: new Map(),
    tokenRoyalties: new Map(),
    tokenMilestones: new Map(),
    tokensByOwner: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  stxTransfers: Array<{ amount: number; from: string; to: string | null }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextTokenId: 0,
      maxTokens: 10000,
      mintFee: 500,
      royaltyRate: 10,
      verifierContract: null,
      tokens: new Map(),
      tokenRoyalties: new Map(),
      tokenMilestones: new Map(),
      tokensByOwner: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.stxTransfers = [];
  }

  setVerifierContract(contractPrincipal: string): Result<boolean> {
    if (this.state.verifierContract !== null) return { ok: false, value: false };
    this.state.verifierContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setMintFee(newFee: number): Result<boolean> {
    if (!this.state.verifierContract) return { ok: false, value: false };
    this.state.mintFee = newFee;
    return { ok: true, value: true };
  }

  setRoyaltyRate(newRate: number): Result<boolean> {
    if (newRate > 20) return { ok: false, value: false };
    if (!this.state.verifierContract) return { ok: false, value: false };
    this.state.royaltyRate = newRate;
    return { ok: true, value: true };
  }

  mintToken(
    storyHash: Uint8Array,
    artUri: string,
    metadata: string,
    recoveryGoal: string,
    milestoneCount: number,
    currency: string,
    location: string,
    groupId: number | null
  ): Result<number> {
    if (this.state.nextTokenId >= this.state.maxTokens) return { ok: false, value: ERR_MAX_TOKENS_EXCEEDED };
    if (storyHash.length !== 32) return { ok: false, value: ERR_INVALID_STORY_HASH };
    if (!artUri || artUri.length > 256) return { ok: false, value: ERR_INVALID_ART_URI };
    if (metadata.length > 512) return { ok: false, value: ERR_INVALID_METADATA };
    if (recoveryGoal.length > 256) return { ok: false, value: ERR_INVALID_RECOVERY_GOAL };
    if (milestoneCount <= 0 || milestoneCount > 10) return { ok: false, value: ERR_INVALID_MILESTONE_COUNT };
    if (!["STX", "BTC", "USD"].includes(currency)) return { ok: false, value: ERR_INVALID_CURRENCY };
    if (location.length > 100) return { ok: false, value: ERR_INVALID_LOCATION };
    if (!this.state.verifierContract) return { ok: false, value: ERR_NOT_AUTHORIZED };

    this.stxTransfers.push({ amount: this.state.mintFee, from: this.caller, to: this.state.verifierContract });

    const id = this.state.nextTokenId;
    const token: Token = {
      owner: this.caller,
      storyHash,
      artUri,
      metadata,
      recoveryGoal,
      milestoneCount,
      timestamp: this.blockHeight,
      status: true,
      currency,
      location,
      groupId,
    };
    this.state.tokens.set(id, token);
    this.state.tokenRoyalties.set(id, { rate: this.state.royaltyRate, beneficiary: this.caller });
    const ownerTokens = this.state.tokensByOwner.get(this.caller) || [];
    this.state.tokensByOwner.set(this.caller, [...ownerTokens, id].slice(0, 100));
    this.state.nextTokenId++;
    return { ok: true, value: id };
  }

  getToken(id: number): Token | null {
    return this.state.tokens.get(id) || null;
  }

  updateTokenMetadata(id: number, newMetadata: string, newArtUri: string): Result<boolean> {
    const token = this.state.tokens.get(id);
    if (!token) return { ok: false, value: false };
    if (token.owner !== this.caller) return { ok: false, value: false };
    if (newMetadata.length > 512) return { ok: false, value: false };
    if (!newArtUri || newArtUri.length > 256) return { ok: false, value: false };

    const updated: Token = {
      ...token,
      metadata: newMetadata,
      artUri: newArtUri,
      timestamp: this.blockHeight,
    };
    this.state.tokens.set(id, updated);
    return { ok: true, value: true };
  }

  transferToken(id: number, newOwner: string): Result<boolean> {
    const token = this.state.tokens.get(id);
    if (!token) return { ok: false, value: false };
    if (token.owner !== this.caller) return { ok: false, value: false };
    const royalty = this.state.tokenRoyalties.get(id);
    if (!royalty) return { ok: false, value: false };

    const royaltyAmount = Math.floor((this.state.mintFee * royalty.rate) / 100);
    this.stxTransfers.push({ amount: royaltyAmount, from: newOwner, to: royalty.beneficiary });

    const updated: Token = { ...token, owner: newOwner };
    this.state.tokens.set(id, updated);
    const senderTokens = (this.state.tokensByOwner.get(this.caller) || []).filter((tid) => tid !== id);
    this.state.tokensByOwner.set(this.caller, senderTokens);
    const receiverTokens = this.state.tokensByOwner.get(newOwner) || [];
    this.state.tokensByOwner.set(newOwner, [...receiverTokens, id].slice(0, 100));
    return { ok: true, value: true };
  }

  addMilestone(id: number, index: number, description: string, achieved: boolean): Result<boolean> {
    const token = this.state.tokens.get(id);
    if (!token) return { ok: false, value: false };
    if (token.owner !== this.caller) return { ok: false, value: false };
    if (index >= token.milestoneCount) return { ok: false, value: false };

    const key = `${id}-${index}`;
    this.state.tokenMilestones.set(key, {
      description,
      achieved,
      timestamp: this.blockHeight,
    });
    return { ok: true, value: true };
  }

  getTokenCount(): Result<number> {
    return { ok: true, value: this.state.nextTokenId };
  }
}

describe("StoryNFT", () => {
  let contract: StoryNFTMock;

  beforeEach(() => {
    contract = new StoryNFTMock();
    contract.reset();
  });

  it("mints a token successfully", () => {
    contract.setVerifierContract("ST2TEST");
    const storyHash = new Uint8Array(32).fill(1);
    const result = contract.mintToken(
      storyHash,
      "ipfs://art",
      "Test metadata",
      "Recovery goal",
      5,
      "STX",
      "LocationX",
      null
    );
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);

    const token = contract.getToken(0);
    expect(token?.owner).toBe("ST1TEST");
    expect(token?.artUri).toBe("ipfs://art");
    expect(token?.metadata).toBe("Test metadata");
    expect(token?.recoveryGoal).toBe("Recovery goal");
    expect(token?.milestoneCount).toBe(5);
    expect(token?.currency).toBe("STX");
    expect(token?.location).toBe("LocationX");
    expect(contract.stxTransfers).toEqual([{ amount: 500, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("rejects mint without verifier contract", () => {
    const storyHash = new Uint8Array(32).fill(1);
    const result = contract.mintToken(
      storyHash,
      "ipfs://art",
      "Test metadata",
      "Recovery goal",
      5,
      "STX",
      "LocationX",
      null
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("rejects invalid story hash", () => {
    contract.setVerifierContract("ST2TEST");
    const storyHash = new Uint8Array(31).fill(1);
    const result = contract.mintToken(
      storyHash,
      "ipfs://art",
      "Test metadata",
      "Recovery goal",
      5,
      "STX",
      "LocationX",
      null
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_STORY_HASH);
  });

  it("updates token metadata successfully", () => {
    contract.setVerifierContract("ST2TEST");
    const storyHash = new Uint8Array(32).fill(1);
    contract.mintToken(
      storyHash,
      "ipfs://old-art",
      "Old metadata",
      "Recovery goal",
      5,
      "STX",
      "LocationX",
      null
    );
    const result = contract.updateTokenMetadata(0, "New metadata", "ipfs://new-art");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const token = contract.getToken(0);
    expect(token?.metadata).toBe("New metadata");
    expect(token?.artUri).toBe("ipfs://new-art");
  });

  it("rejects update for non-owner", () => {
    contract.setVerifierContract("ST2TEST");
    const storyHash = new Uint8Array(32).fill(1);
    contract.mintToken(
      storyHash,
      "ipfs://art",
      "Test metadata",
      "Recovery goal",
      5,
      "STX",
      "LocationX",
      null
    );
    contract.caller = "ST3FAKE";
    const result = contract.updateTokenMetadata(0, "New metadata", "ipfs://new-art");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("transfers token successfully", () => {
    contract.setVerifierContract("ST2TEST");
    const storyHash = new Uint8Array(32).fill(1);
    contract.mintToken(
      storyHash,
      "ipfs://art",
      "Test metadata",
      "Recovery goal",
      5,
      "STX",
      "LocationX",
      null
    );
    const result = contract.transferToken(0, "ST4NEW");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const token = contract.getToken(0);
    expect(token?.owner).toBe("ST4NEW");
    expect(contract.stxTransfers.length).toBe(2);
    expect(contract.stxTransfers[1]).toEqual({ amount: 50, from: "ST4NEW", to: "ST1TEST" });
  });

  it("rejects transfer for non-owner", () => {
    contract.setVerifierContract("ST2TEST");
    const storyHash = new Uint8Array(32).fill(1);
    contract.mintToken(
      storyHash,
      "ipfs://art",
      "Test metadata",
      "Recovery goal",
      5,
      "STX",
      "LocationX",
      null
    );
    contract.caller = "ST3FAKE";
    const result = contract.transferToken(0, "ST4NEW");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("adds milestone successfully", () => {
    contract.setVerifierContract("ST2TEST");
    const storyHash = new Uint8Array(32).fill(1);
    contract.mintToken(
      storyHash,
      "ipfs://art",
      "Test metadata",
      "Recovery goal",
      5,
      "STX",
      "LocationX",
      null
    );
    const result = contract.addMilestone(0, 0, "First milestone", true);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const milestone = contract.state.tokenMilestones.get("0-0");
    expect(milestone?.description).toBe("First milestone");
    expect(milestone?.achieved).toBe(true);
  });

  it("rejects milestone for invalid index", () => {
    contract.setVerifierContract("ST2TEST");
    const storyHash = new Uint8Array(32).fill(1);
    contract.mintToken(
      storyHash,
      "ipfs://art",
      "Test metadata",
      "Recovery goal",
      5,
      "STX",
      "LocationX",
      null
    );
    const result = contract.addMilestone(0, 5, "Invalid milestone", true);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("sets mint fee successfully", () => {
    contract.setVerifierContract("ST2TEST");
    const result = contract.setMintFee(1000);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.mintFee).toBe(1000);
  });

  it("sets royalty rate successfully", () => {
    contract.setVerifierContract("ST2TEST");
    const result = contract.setRoyaltyRate(15);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.royaltyRate).toBe(15);
  });

  it("rejects invalid royalty rate", () => {
    contract.setVerifierContract("ST2TEST");
    const result = contract.setRoyaltyRate(25);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("returns correct token count", () => {
    contract.setVerifierContract("ST2TEST");
    const storyHash = new Uint8Array(32).fill(1);
    contract.mintToken(
      storyHash,
      "ipfs://art1",
      "Metadata1",
      "Goal1",
      3,
      "STX",
      "Loc1",
      null
    );
    contract.mintToken(
      storyHash,
      "ipfs://art2",
      "Metadata2",
      "Goal2",
      4,
      "BTC",
      "Loc2",
      1
    );
    const result = contract.getTokenCount();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(2);
  });

  it("rejects mint with max tokens exceeded", () => {
    contract.setVerifierContract("ST2TEST");
    contract.state.maxTokens = 1;
    const storyHash = new Uint8Array(32).fill(1);
    contract.mintToken(
      storyHash,
      "ipfs://art",
      "Test metadata",
      "Recovery goal",
      5,
      "STX",
      "LocationX",
      null
    );
    const result = contract.mintToken(
      storyHash,
      "ipfs://art2",
      "Metadata2",
      "Goal2",
      4,
      "BTC",
      "Loc2",
      1
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_TOKENS_EXCEEDED);
  });
});