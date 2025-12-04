<?php

namespace App\Services;

use phpseclib3\Crypt\RSA;
use phpseclib3\Crypt\EC;
use phpseclib3\Crypt\PublicKeyLoader;

class SshKeyService
{
    /**
     * Generate SSH key pair based on algorithm
     *
     * @param string $algorithm The algorithm to use (rsa, ed25519, ecdsa)
     * @param int|null $keySize The key size (only for RSA: 2048 or 4096)
     * @param string|null $passphrase Optional passphrase to encrypt the private key
     * @return array Returns array with private_key, public_key, and fingerprint
     */
    public function generateKeyPair(string $algorithm, ?int $keySize = null, ?string $passphrase = null): array
    {
        switch (strtolower($algorithm)) {
            case 'rsa':
                return $this->generateRSAKey($keySize ?? 2048, $passphrase);
            
            case 'ed25519':
                return $this->generateED25519Key($passphrase);
            
            case 'ecdsa':
                return $this->generateECDSAKey($passphrase);
            
            default:
                throw new \InvalidArgumentException("Unsupported algorithm: {$algorithm}");
        }
    }

    /**
     * Generate RSA key pair
     */
    private function generateRSAKey(int $keySize, ?string $passphrase): array
    {
        $key = RSA::createKey($keySize);
        
        // Get private key
        if ($passphrase) {
            $privateKey = $key->withPassword($passphrase)->toString('OpenSSH');
        } else {
            $privateKey = $key->toString('OpenSSH');
        }
        
        // Get public key
        $publicKey = $key->getPublicKey()->toString('OpenSSH');
        
        // Calculate fingerprint
        $fingerprint = $this->calculateFingerprint($key->getPublicKey());
        
        return [
            'private_key' => $privateKey,
            'public_key' => $publicKey,
            'fingerprint' => $fingerprint,
        ];
    }

    /**
     * Generate ED25519 key pair
     */
    private function generateED25519Key(?string $passphrase): array
    {
        $key = EC::createKey('Ed25519');
        
        // Get private key
        if ($passphrase) {
            $privateKey = $key->withPassword($passphrase)->toString('OpenSSH');
        } else {
            $privateKey = $key->toString('OpenSSH');
        }
        
        // Get public key
        $publicKey = $key->getPublicKey()->toString('OpenSSH');
        
        // Calculate fingerprint
        $fingerprint = $this->calculateFingerprint($key->getPublicKey());
        
        return [
            'private_key' => $privateKey,
            'public_key' => $publicKey,
            'fingerprint' => $fingerprint,
        ];
    }

    /**
     * Generate ECDSA key pair
     */
    private function generateECDSAKey(?string $passphrase): array
    {
        $key = EC::createKey('secp256r1');
        
        // Get private key
        if ($passphrase) {
            $privateKey = $key->withPassword($passphrase)->toString('OpenSSH');
        } else {
            $privateKey = $key->toString('OpenSSH');
        }
        
        // Get public key
        $publicKey = $key->getPublicKey()->toString('OpenSSH');
        
        // Calculate fingerprint
        $fingerprint = $this->calculateFingerprint($key->getPublicKey());
        
        return [
            'private_key' => $privateKey,
            'public_key' => $publicKey,
            'fingerprint' => $fingerprint,
        ];
    }

    /**
     * Calculate SSH fingerprint (SHA256)
     */
    private function calculateFingerprint($publicKey): string
    {
        $raw = $publicKey->toString('OpenSSH');
        
        // Extract the base64 part
        $parts = explode(' ', $raw);
        $keyData = base64_decode($parts[1]);
        
        // Calculate SHA256 hash
        $hash = hash('sha256', $keyData, true);
        
        // Return in standard SSH format
        return 'SHA256:' . rtrim(base64_encode($hash), '=');
    }
}
