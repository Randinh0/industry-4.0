import { ProcessTraceContract } from '../src/processTrace';
import { Context } from 'fabric-contract-api';
import { expect } from 'chai';
import sinon from 'sinon';

describe('ProcessTraceContract', () => {
  let contract: ProcessTraceContract;
  let ctx: sinon.SinonStubbedInstance<Context>;

  beforeEach(() => {
    contract = new ProcessTraceContract();
    ctx = sinon.createStubInstance(Context);
    // Mock de stub
    (ctx.stub as any) = {
      getState: sinon.stub(),
      putState: sinon.stub(),
      deleteState: sinon.stub(),
      getStateByRange: sinon.stub().returns({
        next: async () => ({ done: true }),
        close: async () => {}
      }),
      setEvent: sinon.stub()
    };
  });

  it('debe crear un lote nuevo', async () => {
    (ctx.stub.getState as any).resolves(Buffer.from(''));
    (ctx.stub.putState as any).resolves();
    
    await contract.CreateBatch(ctx as unknown as Context, 'BATCH001', 'acero', 'Supplier1', 1000);
    
    expect((ctx.stub.putState as any).calledOnce).to.be.true;
  });

  it('debe lanzar error si el batchId ya existe', async () => {
    (ctx.stub.getState as any).resolves(Buffer.from('{"batchId":"BATCH001"}'));
    
    try {
      await contract.CreateBatch(ctx as unknown as Context, 'BATCH001', 'acero', 'Supplier1', 1000);
      expect.fail('No lanzó error');
    } catch (err: any) {
      expect(err.message).to.include('ya existe');
    }
  });

  it('debe registrar entrada de material', async () => {
    const batchData = {
      batchId: 'BATCH001',
      materialType: 'acero',
      supplier: 'Supplier1',
      totalQuantity: 1000,
      currentQuantity: 1000,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    (ctx.stub.getState as any).resolves(Buffer.from(JSON.stringify(batchData)));
    (ctx.stub.putState as any).resolves();
    
    const traceId = await contract.RecordInput(
      ctx as unknown as Context, 
      'BATCH001', 
      500, 
      'Almacen1', 
      'Planta1', 
      'PROC001', 
      'operator1'
    );
    
    expect(traceId).to.include('BATCH001_input');
    expect((ctx.stub.setEvent as any).calledOnce).to.be.true;
  });

  it('debe registrar salida de material y actualizar cantidad', async () => {
    const batchData = {
      batchId: 'BATCH001',
      materialType: 'acero',
      supplier: 'Supplier1',
      totalQuantity: 1000,
      currentQuantity: 1000,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    (ctx.stub.getState as any).resolves(Buffer.from(JSON.stringify(batchData)));
    (ctx.stub.putState as any).resolves();
    
    const traceId = await contract.RecordOutput(
      ctx as unknown as Context, 
      'BATCH001', 
      300, 
      'Planta1', 
      'Almacen2', 
      'PROC002', 
      'operator2'
    );
    
    expect(traceId).to.include('BATCH001_output');
    expect((ctx.stub.putState as any).calledTwice).to.be.true; // trace + batch update
  });

  it('debe lanzar error si cantidad insuficiente en salida', async () => {
    const batchData = {
      batchId: 'BATCH001',
      materialType: 'acero',
      supplier: 'Supplier1',
      totalQuantity: 1000,
      currentQuantity: 200, // Menos de lo que se quiere sacar
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    (ctx.stub.getState as any).resolves(Buffer.from(JSON.stringify(batchData)));
    
    try {
      await contract.RecordOutput(
        ctx as unknown as Context, 
        'BATCH001', 
        300, // Más de lo disponible
        'Planta1', 
        'Almacen2', 
        'PROC002', 
        'operator2'
      );
      expect.fail('No lanzó error');
    } catch (err: any) {
      expect(err.message).to.include('Cantidad insuficiente');
    }
  });
}); 