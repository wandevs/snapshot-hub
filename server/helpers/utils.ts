import { verifyMessage } from '@ethersproject/wallet';
import { providers } from 'ethers';
import { convertUtf8ToHex } from '@walletconnect/utils';
import * as ethUtil from 'ethereumjs-util';
import { isValidSignature } from './eip1271';

export function jsonParse(input, fallback?) {
  try {
    return JSON.parse(input);
  } catch (err) {
    return fallback || {};
  }
}

export async function verify(address, msg, sig) {
  const recovered = await verifyMessage(msg, sig);
  return recovered === address;
}

export function clone(item) {
  return JSON.parse(JSON.stringify(item));
}

export function sendError(res, description) {
  return res.status(500).json({
    error: 'unauthorized',
    error_description: description
  });
}

export function recoverPublicKey(sig: string, hash: string): string {
  const params = ethUtil.fromRpcSig(sig);
  const result = ethUtil.ecrecover(
    ethUtil.toBuffer(hash),
    params.v,
    params.r,
    params.s
  );
  return ethUtil.bufferToHex(ethUtil.publicToAddress(result));
}

export async function verifySignature(
  address: string,
  sig: string,
  hash: string
  // chainId: number
): Promise<boolean> {
  console.log('verifySignature 1', address)
  const rpcUrl =
    'https://gwan-ssl.wandevs.org:56891';
  const provider = new providers.JsonRpcProvider(rpcUrl);
  console.log('verifySignature 2')
  const bytecode = await provider.getCode(address);
  console.log('verifySignature 3', bytecode)
  
  if (
    !bytecode ||
    bytecode === '0x' ||
    bytecode === '0x0' ||
    bytecode === '0x00'
  ) {
    const signer = recoverPublicKey(sig, hash);
    return signer.toLowerCase() === address.toLowerCase();
  } else {
    console.log('Smart contract signature');
    return isValidSignature(address, sig, hash, provider);
  }
}

export function encodePersonalMessage(msg: string): string {
  const data = ethUtil.toBuffer(convertUtf8ToHex(msg));
  const buf = Buffer.concat([
    Buffer.from(
      '\u0019Ethereum Signed Message:\n' + data.length.toString(),
      'utf8'
    ),
    data
  ]);
  return ethUtil.bufferToHex(buf);
}

export function hashPersonalMessage(msg: string): string {
  const data = encodePersonalMessage(msg);
  const buf = ethUtil.toBuffer(data);
  const hash = ethUtil.keccak256(buf);
  return ethUtil.bufferToHex(hash);
}
