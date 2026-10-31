import { persistence } from './PersistenceService.js';

class VercelService {
  getToken() {
    const settings = persistence.loadSettings();
    return settings.vercelToken || process.env.VERCEL_TOKEN || null;
  }

  async testAuth(token = null) {
    const activeToken = token || this.getToken();
    if (!activeToken) {
      return { success: false, error: 'No Vercel token configured' };
    }

    try {
      const response = await fetch('https://api.vercel.com/v2/user', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      if (!response.ok) {
        return { success: false, error: `Vercel Auth Failed (${response.status})` };
      }

      const data = await response.json();
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async deploy(projectName, files = {}, token = null) {
    const activeToken = token || this.getToken();
    if (!activeToken) {
      return { success: false, error: 'No Vercel token configured' };
    }

    try {
      const response = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          files: Object.entries(files).map(([file, data]) => ({ file, data })),
          projectSettings: { framework: 'vite' },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error?.message || 'Deployment error' };
      }

      return {
        success: true,
        url: data.url ? `https://${data.url}` : null,
        id: data.id,
        readyState: data.readyState,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export const vercelService = new VercelService();
