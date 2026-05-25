import type { Command } from './Command';
import { shipmentService } from '../api/shipmentService';
import type { Shipment } from '../types';

export class UpdateStatusCommand implements Command<Shipment> {
  private previousStatus: string | null = null;

  constructor(
    private shipmentId: string,
    private newStatus: string,
  ) {}

  async execute(): Promise<Shipment> {
    const current = await shipmentService.getById(this.shipmentId);
    this.previousStatus = current.status;

    return shipmentService.updateStatus(this.shipmentId, this.newStatus);
  }

  async undo(): Promise<void> {
    if (!this.previousStatus) return;
    await shipmentService.updateStatus(this.shipmentId, this.previousStatus);
  }

  getDescription(): string {
    return `UpdateStatus: ${this.shipmentId.slice(0, 8)} → ${this.newStatus}`;
  }
}
