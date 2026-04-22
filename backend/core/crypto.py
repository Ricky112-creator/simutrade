import os
from cryptography.fernet import Fernet, InvalidToken

_key = os.environ.get("DERIV_ENC_KEY")
if not _key:
    raise RuntimeError("DERIV_ENC_KEY not set in .env")

_fernet = Fernet(_key.encode() if isinstance(_key, str) else _key)


def encrypt(plaintext: str) -> str:
    return _fernet.encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    try:
        return _fernet.decrypt(ciphertext.encode()).decode()
    except InvalidToken as e:
        raise ValueError("Invalid encrypted token") from e
