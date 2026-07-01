// A simple Web Crypto API helper for ECDH Key Agreement and AES-GCM Encryption
export class CryptoManager {
  private keyPair: CryptoKeyPair | null = null;
  private sharedSecret: CryptoKey | null = null;

  async generateKeyPair() {
    this.keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      ["deriveKey"]
    );
    return this.keyPair;
  }

  async getPublicKeyRaw(): Promise<JsonWebKey> {
    if (!this.keyPair) throw new Error("Keypair not generated");
    return await window.crypto.subtle.exportKey("jwk", this.keyPair.publicKey);
  }

  async deriveSharedSecret(otherPublicKeyJwk: JsonWebKey) {
    if (!this.keyPair) throw new Error("Keypair not generated");
    
    const otherPublicKey = await window.crypto.subtle.importKey(
      "jwk",
      otherPublicKeyJwk,
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      []
    );

    this.sharedSecret = await window.crypto.subtle.deriveKey(
      {
        name: "ECDH",
        public: otherPublicKey,
      },
      this.keyPair.privateKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  async encrypt(message: string): Promise<{ ciphertext: string; iv: string }> {
    if (!this.sharedSecret) throw new Error("Shared secret not established");

    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      this.sharedSecret,
      encodedMessage
    );

    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
      iv: btoa(String.fromCharCode(...iv)),
    };
  }

  async decrypt(encryptedData: { ciphertext: string; iv: string }): Promise<string> {
    if (!this.sharedSecret) throw new Error("Shared secret not established");

    const ciphertextBuffer = new Uint8Array(atob(encryptedData.ciphertext).split("").map(c => c.charCodeAt(0)));
    const ivBuffer = new Uint8Array(atob(encryptedData.iv).split("").map(c => c.charCodeAt(0)));

    try {
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: ivBuffer,
        },
        this.sharedSecret,
        ciphertextBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (e) {
      console.error("Decryption failed", e);
      return "[Decryption Failed]";
    }
  }
}
