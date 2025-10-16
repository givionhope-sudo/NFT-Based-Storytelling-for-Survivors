# 🌟 NFT-Based Storytelling for Survivors

Welcome to an empowering Web3 platform that supports survivors of trauma, disasters, or hardships by turning their personal stories into NFT art. This project uses the Stacks blockchain and Clarity smart contracts to enable survivors to create, share, and monetize digital art that narrates their journeys. Sales and royalties from these NFTs generate ongoing funds directly linked to the survivor's recovery progress, fostering community support while ensuring transparency and immutability.

This solves a real-world problem: Survivors often face financial barriers during recovery (e.g., therapy, housing, or rebuilding lives). Traditional fundraising lacks transparency and long-term engagement. Our platform uses NFTs to create verifiable, story-driven art that raises funds perpetually through sales, resales, and progress-linked milestones, building a supportive ecosystem.

## ✨ Features

📖 Create and mint story-based NFTs with embedded survivor narratives  
💰 Sell NFTs on an integrated marketplace with automated royalty distributions  
🔄 Track recovery progress milestones to unlock additional funds or bonuses  
🤝 Community donations pooled and distributed based on verified progress  
✅ Verify survivor authenticity to build trust and prevent fraud  
🔒 Immutable records of stories, sales, and fund allocations  
🎨 Dynamic art updates tied to recovery stages for evolving NFTs  
📊 Transparent analytics for donors and buyers on fund impact  

## 🛠 How It Works

The platform is built on 8 Clarity smart contracts that handle registration, NFT creation, sales, funding, and verification. Here's a high-level overview:

1. **UserRegistry.clar**: Registers survivors and artists, storing verified profiles with basic info (e.g., wallet address, bio). Ensures only authenticated users can participate.
2. **StoryNFT.clar**: Manages minting of ERC-721-like NFTs on Stacks. Each NFT includes a story hash, art metadata, and links to recovery goals.
3. **Marketplace.clar**: Facilitates listing, buying, and selling of NFTs with fixed-price or auction mechanisms. Integrates with royalty payouts.
4. **RoyaltyManager.clar**: Handles perpetual royalties (e.g., 10% on resales) directed to the survivor's wallet or recovery fund.
5. **ProgressTracker.clar**: Allows survivors to update and verify recovery milestones (e.g., "Completed therapy phase"). Triggers events for fund releases.
6. **FundDistributor.clar**: Automates distribution of sales proceeds and donations based on progress. Uses escrow-like logic to hold funds until milestones are met.
7. **VerificationContract.clar**: Integrates with off-chain oracles for survivor verification (e.g., via trusted partners). Prevents unauthorized claims.
8. **DonationPool.clar**: Collects community donations into a shared pool, allocating them proportionally to active survivors based on community votes or progress scores.

**For Survivors/Creators**  
- Register via UserRegistry and get verified through VerificationContract.  
- Mint your story as an NFT using StoryNFT, uploading art and narrative details.  
- List it on Marketplace and set recovery milestones in ProgressTracker.  
- As sales occur, RoyaltyManager and FundDistributor handle payouts, with bonuses unlocked via progress updates.  

**For Buyers/Donors**  
- Browse and purchase NFTs on Marketplace—each buy supports the survivor directly.  
- Donate to the DonationPool for broader impact.  
- View transparent progress via ProgressTracker and fund trails in FundDistributor.  
- Resell NFTs knowing royalties continue to aid recovery.  

**For Verifiers/Community**  
- Use VerificationContract to confirm authenticity.  
- Query any contract (e.g., get-nft-details in StoryNFT) for immutable records.  
- Participate in governance-like votes through DonationPool for fund allocation.  

This setup ensures secure, decentralized operations with minimal trust required. Deploy on Stacks for low fees and Bitcoin-secured finality. Start building by cloning this repo and deploying the contracts! 🚀