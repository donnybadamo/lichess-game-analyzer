// Azure Function Proxy for Key Vault
// Deploy this as an Azure Function to securely access Key Vault secrets
// Uses Service Principal (username/password) authentication

const { SecretClient } = require("@azure/keyvault-secrets");
const { ClientSecretCredential } = require("@azure/identity");

module.exports = async function (context, req) {
    const keyVaultUrl = process.env.KEY_VAULT_URL;
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    
    // Validate required environment variables
    if (!keyVaultUrl) {
        context.res = {
            status: 500,
            body: { error: "KEY_VAULT_URL environment variable not set" }
        };
        return;
    }
    
    if (!tenantId || !clientId || !clientSecret) {
        context.res = {
            status: 500,
            body: { error: "Azure credentials not configured. Set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET" }
        };
        return;
    }
    
    // Create credential using Service Principal (username/password)
    const credential = new ClientSecretCredential(
        tenantId,
        clientId,
        clientSecret
    );
    
    const client = new SecretClient(keyVaultUrl, credential);
    
    const secretName = req.body?.secretName || req.query.secretName;
    
    if (!secretName) {
        context.res = {
            status: 400,
            body: { error: "secretName is required in body or query" }
        };
        return;
    }
    
    try {
        const secret = await client.getSecret(secretName);
        
        context.res = {
            status: 200,
            body: { 
                secretValue: secret.value,
                secretName: secretName
            }
        };
    } catch (error) {
        context.log.error('Key Vault error:', error);
        context.res = {
            status: 500,
            body: { 
                error: "Failed to retrieve secret",
                message: error.message
            }
        };
    }
};

