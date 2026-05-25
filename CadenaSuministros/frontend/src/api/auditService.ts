import api from './client';

export const auditService = {
  async getCommandHistory(): Promise<string[]> {
    return api.get<string[]>('/shipments/commands');
  },
};

export default auditService;
