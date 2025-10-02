# Export Copper Metadata

To run the mapping script without Firebase credentials, first export the Copper metadata:

## Step 1: Fetch Copper Metadata via API

Open your browser and go to:
```
https://your-app-url.vercel.app/api/copper/metadata
```

Or use curl:
```bash
curl https://your-app-url.vercel.app/api/copper/metadata > docs/copper_metadata.json
```

## Step 2: Save to File

Copy the JSON response and save it to:
```
docs/copper_metadata.json
```

## Step 3: Run Mapping Script

```bash
node scripts/create-fishbowl-copper-mappings-local.js
```

This will read from the local JSON file instead of Firebase.
