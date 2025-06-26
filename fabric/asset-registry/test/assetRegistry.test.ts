import { AssetRegistryContract } from '../src/assetRegistry';
import { Context } from 'fabric-contract-api';
import { expect } from 'chai';
import sinon from 'sinon';

describe('AssetRegistryContract', () => {
  let contract: AssetRegistryContract;
  let ctx: sinon.SinonStubbedInstance<Context>;

  beforeEach(() => {
    contract = new AssetRegistryContract();
    ctx = sinon.createStubInstance(Context);
    // Mock de stub
    (ctx.stub as any) = {
      getState: sinon.stub(),
      putState: sinon.stub(),
      deleteState: sinon.stub(),
      getStateByRange: sinon.stub().returns({
        next: async () => ({ done: true }),
        close: async () => {}
      })
    };
  });

  it('debe crear un activo nuevo', async () => {
    (ctx.stub.getState as any).resolves(Buffer.from(''));
    (ctx.stub.putState as any).resolves();
    await contract.CreateAsset(ctx as unknown as Context, 'A1', 'Org1', 'Planta1', 'motor', '{"temp":70}');
    expect((ctx.stub.putState as any).calledOnce).to.be.true;
  });

  it('debe lanzar error si el assetId ya existe', async () => {
    (ctx.stub.getState as any).resolves(Buffer.from('{"assetId":"A1"}'));
    try {
      await contract.CreateAsset(ctx as unknown as Context, 'A1', 'Org1', 'Planta1', 'motor', '{"temp":70}');
      expect.fail('No lanzó error');
    } catch (err: any) {
      expect(err.message).to.include('ya existe');
    }
  });
}); 