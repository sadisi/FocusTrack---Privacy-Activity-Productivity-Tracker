import { StorageService } from '../services/storage';
import { ExtensionStorage } from '../types';

export async function exportDataAsJSON(): Promise<void> {
  const data = await StorageService.getStorage();
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `focustrack-export-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportDataAsCSV(): Promise<void> {
  const activities = await StorageService.getActivities();
  const settings = await StorageService.getSettings();

  const headers = ['Date', 'Domain', 'Category', 'TimeSpentSeconds', 'TimeSpentFormatted', 'VisitCount', 'LastActive'];
  const rows: string[] = [headers.join(',')];

  Object.values(activities).forEach((daily) => {
    Object.values(daily.domains || {}).forEach((d) => {
      const minutes = Math.floor(d.totalTime / 60);
      const hours = (minutes / 60).toFixed(2);
      const timeFormatted = `${hours}h (${minutes}m)`;
      const dateStr = daily.date;
      const domainStr = `"${d.domain.replace(/"/g, '""')}"`;
      const catStr = `"${d.category.replace(/"/g, '""')}"`;
      const lastActiveStr = new Date(d.lastActive).toISOString();

      rows.push([dateStr, domainStr, catStr, d.totalTime, `"${timeFormatted}"`, d.visitCount, lastActiveStr].join(','));
    });
  });

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `focustrack-activity-${timestamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importDataFromJSON(jsonContent: string): Promise<{ success: boolean; message: string }> {
  try {
    const parsed: Partial<ExtensionStorage> = JSON.parse(jsonContent);

    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: 'Invalid file format. File must contain a JSON object.' };
    }

    if (parsed.settings) {
      await StorageService.saveSettings(parsed.settings);
    }

    if (parsed.activities) {
      const currentActivities = await StorageService.getActivities();
      const mergedActivities = { ...currentActivities, ...parsed.activities };
      await StorageService.saveActivities(mergedActivities);
    }

    return { success: true, message: 'Data imported successfully!' };
  } catch (err: any) {
    return { success: false, message: `Failed to import data: ${err.message || 'JSON parse error'}` };
  }
}
