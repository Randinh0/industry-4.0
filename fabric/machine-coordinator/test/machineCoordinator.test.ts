import { MachineCoordinatorContract } from '../src/machineCoordinator';
import { Context } from 'fabric-contract-api';
import { expect } from 'chai';
import sinon from 'sinon';

describe('MachineCoordinatorContract', () => {
  let contract: MachineCoordinatorContract;
  let ctx: sinon.SinonStubbedInstance<Context>;

  beforeEach(() => {
    contract = new MachineCoordinatorContract();
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

  it('debe registrar una máquina nueva', async () => {
    (ctx.stub.getState as any).resolves(Buffer.from(''));
    (ctx.stub.putState as any).resolves();
    
    await contract.RegisterMachine(
      ctx as unknown as Context, 
      'MACH001', 
      'Motor Principal', 
      'motor', 
      'Planta A', 
      'operator1',
      95, // uptimeTarget
      1000 // responseTimeTarget
    );
    
    expect((ctx.stub.putState as any).calledOnce).to.be.true;
    expect((ctx.stub.setEvent as any).calledOnce).to.be.true;
  });

  it('debe lanzar error si la máquina ya existe', async () => {
    (ctx.stub.getState as any).resolves(Buffer.from('{"machineId":"MACH001"}'));
    
    try {
      await contract.RegisterMachine(
        ctx as unknown as Context, 
        'MACH001', 
        'Motor Principal', 
        'motor', 
        'Planta A', 
        'operator1',
        95,
        1000
      );
      expect.fail('No lanzó error');
    } catch (err: any) {
      expect(err.message).to.include('ya está registrada');
    }
  });

  it('debe iniciar una máquina correctamente', async () => {
    const machineData = {
      machineId: 'MACH001',
      name: 'Motor Principal',
      type: 'motor',
      location: 'Planta A',
      status: 'stopped',
      currentMode: 'manual',
      operator: 'operator1',
      lastStateChange: Date.now(),
      totalOperatingHours: 0,
      lastMaintenance: Date.now(),
      nextMaintenanceDue: Date.now() + (30 * 24 * 60 * 60 * 1000),
      slaCompliance: {
        uptimeTarget: 95,
        currentUptime: 0,
        responseTimeTarget: 1000,
        currentResponseTime: 0,
        lastSLAUpdate: Date.now(),
        slaViolations: 0,
        lastViolation: 0
      },
      performanceMetrics: {
        temperature: 0,
        pressure: 0,
        vibration: 0,
        efficiency: 0,
        powerConsumption: 0,
        throughput: 0,
        lastMetricsUpdate: Date.now()
      }
    };
    
    (ctx.stub.getState as any).resolves(Buffer.from(JSON.stringify(machineData)));
    (ctx.stub.putState as any).resolves();
    
    const transitionId = await contract.StartMachine(
      ctx as unknown as Context, 
      'MACH001', 
      'operator2',
      'automatic'
    );
    
    expect(transitionId).to.include('MACH001_start');
    expect((ctx.stub.putState as any).calledTwice).to.be.true; // machine + transition
    expect((ctx.stub.setEvent as any).calledOnce).to.be.true;
  });

  it('debe lanzar error al iniciar máquina ya en ejecución', async () => {
    const machineData = {
      machineId: 'MACH001',
      status: 'running',
      currentMode: 'automatic',
      slaCompliance: { uptimeTarget: 95, currentUptime: 0, responseTimeTarget: 1000, currentResponseTime: 0, lastSLAUpdate: Date.now(), slaViolations: 0, lastViolation: 0 },
      performanceMetrics: { temperature: 0, pressure: 0, vibration: 0, efficiency: 0, powerConsumption: 0, throughput: 0, lastMetricsUpdate: Date.now() }
    };
    
    (ctx.stub.getState as any).resolves(Buffer.from(JSON.stringify(machineData)));
    
    try {
      await contract.StartMachine(ctx as unknown as Context, 'MACH001', 'operator1');
      expect.fail('No lanzó error');
    } catch (err: any) {
      expect(err.message).to.include('ya está en ejecución');
    }
  });

  it('debe pausar una máquina en ejecución', async () => {
    const machineData = {
      machineId: 'MACH001',
      status: 'running',
      currentMode: 'automatic',
      slaCompliance: { uptimeTarget: 95, currentUptime: 0, responseTimeTarget: 1000, currentResponseTime: 0, lastSLAUpdate: Date.now(), slaViolations: 0, lastViolation: 0 },
      performanceMetrics: { temperature: 0, pressure: 0, vibration: 0, efficiency: 0, powerConsumption: 0, throughput: 0, lastMetricsUpdate: Date.now() }
    };
    
    (ctx.stub.getState as any).resolves(Buffer.from(JSON.stringify(machineData)));
    (ctx.stub.putState as any).resolves();
    
    const transitionId = await contract.PauseMachine(
      ctx as unknown as Context, 
      'MACH001', 
      'operator1',
      'Pausa programada'
    );
    
    expect(transitionId).to.include('MACH001_pause');
    expect((ctx.stub.putState as any).calledTwice).to.be.true;
  });

  it('debe actualizar métricas de rendimiento y verificar SLA', async () => {
    const machineData = {
      machineId: 'MACH001',
      status: 'running',
      slaCompliance: { uptimeTarget: 95, currentUptime: 0, responseTimeTarget: 1000, currentResponseTime: 0, lastSLAUpdate: Date.now(), slaViolations: 0, lastViolation: 0 },
      performanceMetrics: { temperature: 0, pressure: 0, vibration: 0, efficiency: 0, powerConsumption: 0, throughput: 0, lastMetricsUpdate: Date.now() }
    };
    
    (ctx.stub.getState as any).resolves(Buffer.from(JSON.stringify(machineData)));
    (ctx.stub.putState as any).resolves();
    
    await contract.UpdatePerformanceMetrics(
      ctx as unknown as Context,
      'MACH001',
      85, // temperatura alta
      50,
      5,
      75, // eficiencia baja
      100,
      50
    );
    
    // Verificar que se llamó putState al menos una vez (puede ser más por la verificación de SLA)
    expect((ctx.stub.putState as any).called).to.be.true;
  });

  it('debe programar mantenimiento', async () => {
    const machineData = {
      machineId: 'MACH001',
      status: 'running',
      slaCompliance: { uptimeTarget: 95, currentUptime: 0, responseTimeTarget: 1000, currentResponseTime: 0, lastSLAUpdate: Date.now(), slaViolations: 0, lastViolation: 0 },
      performanceMetrics: { temperature: 0, pressure: 0, vibration: 0, efficiency: 0, powerConsumption: 0, throughput: 0, lastMetricsUpdate: Date.now() }
    };
    
    (ctx.stub.getState as any).resolves(Buffer.from(JSON.stringify(machineData)));
    (ctx.stub.putState as any).resolves();
    
    const maintenanceId = await contract.ScheduleMaintenance(
      ctx as unknown as Context,
      'MACH001',
      'preventive',
      Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 días
      120, // 2 horas
      'tech1',
      'medium',
      'Mantenimiento preventivo mensual'
    );
    
    expect(maintenanceId).to.include('maintenance_MACH001');
    expect((ctx.stub.putState as any).calledOnce).to.be.true;
    expect((ctx.stub.setEvent as any).calledOnce).to.be.true;
  });
}); 