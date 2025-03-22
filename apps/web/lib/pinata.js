// lib/pinata.js
import PinataSDK from '@pinata/sdk';
import axios from 'axios'
export function getPinataClient() {
  // Get API credentials from environment variables
  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_API_SECRET;

  // Check if credentials are available
  if (!apiKey || !apiSecret) {
    throw new Error('Pinata API credentials not found in environment variables');
  }

  // The correct way to initialize the Pinata client
  return new PinataSDK({
    pinataApiKey: apiKey,
    pinataSecretApiKey: apiSecret
  });
}

// /**
//  * Upload a question to IPFS via Pinata
//  * @param {string} content - The question content to upload
//  * @param {Object} metadata - Additional metadata for the question
//  * @returns {Promise<string>} - The IPFS CID (Content Identifier)
//  */
// export async function uploadQuestionToIPFS(content, metadata = {}) {
//   try {
//     const pinata = getPinataClient();
    
//     // Prepare the data object with content and metadata
//     const questionData = {
//       content,
//       ...metadata,
//       timestamp: new Date().toISOString()
//     };
    
//     // Use pinJSONToIPFS instead of pinFileToIPFS
//     const result = await pinata.pinJSONToIPFS(questionData, {
//       pinataMetadata: {
//         name: `Question-${Date.now()}`
//       }
//     });
    
//     // Return the IPFS hash (CID)
//     return result.IpfsHash;
//   } catch (error) {
//     console.error('Error uploading to IPFS:', error);
//     throw new Error(`Failed to upload to IPFS: ${error.message}`);
//   }
// }

const PINATA_GATEWAY = 'https://chocolate-key-sailfish-277.mypinata.cloud/ipfs/';

// Uploads question to IPFS
export async function uploadQuestionToIPFS(content, metadata = {}) {
  try {
    const pinata = getPinataClient();
    const questionData = {
      content,
      ...metadata,
      timestamp: new Date().toISOString()
    };

    const result = await pinata.pinJSONToIPFS(questionData, {
      pinataMetadata: { name: `Question-${Date.now()}` }
    });

    return result.IpfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
}

// Fetch question content from Pinata using CID
export async function getQuestionFromIPFS(cid) {
  console.log('CID IS ',cid)
  try {
    const response = await axios.get(`${PINATA_GATEWAY}${cid}`);
    return response.data.content; // Extract question content
  } catch (error) {
    console.error(`Error fetching content from IPFS for CID ${cid}:`, error);
    throw new Error('Failed to retrieve question from IPFS');
  }
}
