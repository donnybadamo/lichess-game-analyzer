# Azure Key Vault Setup Guide

This guide explains how to set up Azure Key Vault integration for securely storing and retrieving your ElevenLabs API credentials.

## Overview

Since Chrome extensions run in the browser and cannot directly access Azure Key Vault, we use an Azure Function as a secure proxy. The extension calls the Azure Function, which authenticates with Key Vault using Service Principal (username/password) credentials and returns the secrets.

## Prerequisites

- Azure account with Key Vault access
- Azure Function App (or ability to create one)
- ElevenLabs API key stored in Azure Key Vault

## Step 1: Store Secrets in Azure Key Vault

1. Go to Azure Portal → Key Vaults
2. Select your Key Vault (or create a new one)
3. Go to **Secrets** → **Generate/Import**
4. Create these secrets:
   - `elevenlabs-api-key` - Your ElevenLabs API key
   - `elevenlabs-agent-id` - Your ElevenLabs Agent ID (optional)
   - `elevenlabs-voice-id` - Your ElevenLabs Voice ID (optional)

## Step 2: Create Service Principal (Username/Password)

1. Create a Service Principal for Key Vault access:
   ```bash
   az ad sp create-for-rbac \
     --name "lichess-analyzer-keyvault" \
     --role contributor \
     --scopes /subscriptions/YOUR_SUBSCRIPTION_ID
   ```

2. Note the output:
   - `appId` → This is your AZURE_CLIENT_ID
   - `password` → This is your AZURE_CLIENT_SECRET (save this!)
   - `tenant` → This is your AZURE_TENANT_ID

3. Grant Key Vault access to the Service Principal:
   ```bash
   az keyvault set-policy \
     --name YOUR_KEYVAULT_NAME \
     --spn YOUR_CLIENT_ID \
     --secret-permissions get list
   ```

## Step 3: Create Azure Function Proxy

1. Create a new Azure Function App:
   ```bash
   az functionapp create \
     --resource-group YOUR_RESOURCE_GROUP \
     --consumption-plan-location eastus \
     --runtime node \
     --functions-version 4 \
     --name YOUR_FUNCTION_APP_NAME \
     --storage-account YOUR_STORAGE_ACCOUNT
   ```

2. Set environment variables in Function App:
   ```bash
   az functionapp config appsettings set \
     --name YOUR_FUNCTION_APP_NAME \
     --resource-group YOUR_RESOURCE_GROUP \
     --settings \
       KEY_VAULT_URL=https://YOUR_KEYVAULT_NAME.vault.azure.net/ \
       AZURE_TENANT_ID=YOUR_TENANT_ID \
       AZURE_CLIENT_ID=YOUR_CLIENT_ID \
       AZURE_CLIENT_SECRET=YOUR_CLIENT_SECRET
   ```

3. Deploy the function code (`azure-function-proxy.js`) to your Function App

## Step 4: Configure Extension

1. Get your Azure Function URL:
   ```
   https://YOUR_FUNCTION_APP_NAME.azurewebsites.net/api/get-secret
   ```

2. Set it in Chrome storage (run in browser console):
   ```javascript
   chrome.storage.local.set({
     azureProxyUrl: 'https://YOUR_FUNCTION_APP_NAME.azurewebsites.net/api/get-secret'
   }, () => console.log('✓ Azure proxy URL saved'));
   ```

## Step 5: Test

1. Reload your extension
2. Open the analysis page
3. Check browser console (F12) - you should see:
   ```
   ✓ Loaded ElevenLabs credentials from Azure Key Vault
   ```

## Security Notes

- ✅ Secrets never stored in extension code
- ✅ Secrets fetched securely from Key Vault
- ✅ Service Principal credentials stored securely in Azure Function App settings
- ✅ No API keys in browser storage (fetched on demand)
- ⚠️ Azure Function URL is public - consider adding authentication
- ⚠️ Service Principal credentials stored in Function App environment variables (encrypted at rest)

## Optional: Add Authentication to Function

To secure your Azure Function endpoint, add authentication:

1. In Azure Portal → Function App → Authentication
2. Enable Authentication
3. Choose authentication provider (Azure AD, API Key, etc.)

Then update `azure-keyvault.js` to include auth headers when calling the function.

## Troubleshooting

**Error: "Azure Key Vault proxy URL not configured"**
- Make sure you set `azureProxyUrl` in Chrome storage

**Error: "Failed to retrieve secret"**
- Check Function App logs in Azure Portal
- Verify Service Principal has Key Vault permissions:
  ```bash
  az keyvault show --name YOUR_KEYVAULT_NAME --query properties.accessPolicies
  ```
- Verify environment variables are set correctly in Function App
- Verify secret names match exactly (case-sensitive)
- Check that Service Principal credentials are correct

**Error: CORS issues**
- Add CORS settings in Function App:
  ```bash
  az functionapp cors add \
    --name YOUR_FUNCTION_APP_NAME \
    --resource-group YOUR_RESOURCE_GROUP \
    --allowed-origins "chrome-extension://YOUR_EXTENSION_ID"
  ```

