"""Crypto helpers (AES-CBC compatible with CryptoJS)."""
from __future__ import annotations

import base64
import hashlib
from Crypto import Random
from Crypto.Cipher import AES


SALT_PREFIX = b"Salted__"


def _bytes_to_key(data: bytes, salt: bytes, output: int = 48) -> bytes:
    if len(salt) != 8:
        raise ValueError("Salt must be 8 bytes")
    data += salt
    key = hashlib.md5(data).digest()
    final_key = key
    while len(final_key) < output:
        key = hashlib.md5(key + data).digest()
        final_key += key
    return final_key[:output]


def encrypt_cryptojs(message: bytes, passphrase: bytes) -> str:
    """Encrypt bytes with CryptoJS-compatible AES-CBC, returning base64 string."""
    salt = Random.new().read(8)
    key_iv = _bytes_to_key(passphrase, salt, 32 + 16)
    key = key_iv[:32]
    iv = key_iv[32:]
    aes = AES.new(key, AES.MODE_CBC, iv)
    length = 16 - (len(message) % 16)
    data = message + (chr(length) * length).encode()
    encrypted = aes.encrypt(data)
    return base64.b64encode(SALT_PREFIX + salt + encrypted).decode("utf-8")


def decrypt_cryptojs(payload: str, passphrase: bytes) -> bytes:
    """Decrypt CryptoJS-compatible AES-CBC base64 payload."""
    raw = base64.b64decode(payload)
    if not raw.startswith(SALT_PREFIX):
        raise ValueError("Invalid CryptoJS payload")
    salt = raw[len(SALT_PREFIX) : len(SALT_PREFIX) + 8]
    data = raw[len(SALT_PREFIX) + 8 :]
    key_iv = _bytes_to_key(passphrase, salt, 32 + 16)
    key = key_iv[:32]
    iv = key_iv[32:]
    aes = AES.new(key, AES.MODE_CBC, iv)
    decrypted = aes.decrypt(data)
    pad = decrypted[-1]
    if pad < 1 or pad > 16:
        raise ValueError("Invalid padding")
    return decrypted[:-pad]
