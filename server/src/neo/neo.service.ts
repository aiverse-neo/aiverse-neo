import { Injectable } from '@nestjs/common';
import Neon, { wallet, u, api, rpc } from '@cityofzion/neon-js';
@Injectable()
export class NeoService {
  async verifySigner(args: {
    message: string;
    signature: string;
    publicKey: string;
  }) {
    return Neon.verify.message(args.message, args.signature, args.publicKey);
  }

  async verifySignerNeoline(args: {
    message: string;
    signature: string;
    publicKey: string;
  }) {
    const parameterHexString = Buffer.from(args.message).toString('hex');
    const lengthHex = u.num2VarInt(parameterHexString.length / 2);
    const concatenatedString = lengthHex + parameterHexString;
    const serializedTransaction = '010001f0' + concatenatedString + '0000';
    return wallet.verify(serializedTransaction, args.signature, args.publicKey);
  }

  getAddressFromPublicKey(publicKey: string) {
    const scriptHash = wallet.getScriptHashFromPublicKey(publicKey);
    return wallet.getAddressFromScriptHash(scriptHash);
  }
}
