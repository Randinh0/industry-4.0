import { Context, Contract } from 'fabric-contract-api';
import { Asset } from './models/asset';

export class AssetRegistryContract extends Contract {
  async CreateAsset(ctx: Context, assetId: string, owner: string, location: string, type: string, metadataIoT: string): Promise<void> {
    const exists = await this.AssetExists(ctx, assetId);
    if (exists) {
      throw new Error(`El activo ${assetId} ya existe`);
    }
    const now = Date.now();
    const asset: Asset = {
      assetId,
      owner,
      location,
      type,
      metadataIoT: JSON.parse(metadataIoT),
      createdAt: now,
      updatedAt: now
    };
    await ctx.stub.putState(assetId, Buffer.from(JSON.stringify(asset)));
  }

  async ReadAsset(ctx: Context, assetId: string): Promise<string> {
    const assetJSON = await ctx.stub.getState(assetId);
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(`El activo ${assetId} no existe`);
    }
    return assetJSON.toString();
  }

  async UpdateAsset(ctx: Context, assetId: string, owner: string, location: string, type: string, metadataIoT: string): Promise<void> {
    const assetJSON = await ctx.stub.getState(assetId);
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(`El activo ${assetId} no existe`);
    }
    const asset: Asset = JSON.parse(assetJSON.toString());
    asset.owner = owner;
    asset.location = location;
    asset.type = type;
    asset.metadataIoT = JSON.parse(metadataIoT);
    asset.updatedAt = Date.now();
    await ctx.stub.putState(assetId, Buffer.from(JSON.stringify(asset)));
  }

  async DeleteAsset(ctx: Context, assetId: string): Promise<void> {
    const exists = await this.AssetExists(ctx, assetId);
    if (!exists) {
      throw new Error(`El activo ${assetId} no existe`);
    }
    await ctx.stub.deleteState(assetId);
  }

  async GetAllAssets(ctx: Context): Promise<string> {
    const allResults: Asset[] = [];
    const iterator = await ctx.stub.getStateByRange('', '');
    let result = await iterator.next();
    while (!result.done) {
      if (result.value && result.value.value.toString()) {
        const asset: Asset = JSON.parse(result.value.value.toString('utf8'));
        allResults.push(asset);
      }
      result = await iterator.next();
    }
    await iterator.close();
    return JSON.stringify(allResults);
  }

  async AssetExists(ctx: Context, assetId: string): Promise<boolean> {
    const assetJSON = await ctx.stub.getState(assetId);
    return assetJSON && assetJSON.length > 0;
  }
} 