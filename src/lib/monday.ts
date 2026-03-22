/**
 * Monday.com API Client for Chronos Task Tracker
 */

export interface BoardMetadata {
  name: string;
  groups: Array<{ id: string; title: string }>;
  columns: Array<{
    id: string;
    title: string;
    type: string;
    options?: string[];
  }>;
}

export interface BoardResult {
  success: boolean;
  metadata?: BoardMetadata;
  error?: string;
}

const countryCodeMap: Record<string, string> = {
  'United States': 'US',
  'United Kingdom': 'GB',
  'Canada': 'CA',
  'Australia': 'AU',
  'Germany': 'DE',
  'France': 'FR',
  'Japan': 'JP',
  'China': 'CN',
  'India': 'IN',
  'Brazil': 'BR',
};

const READ_ONLY_TYPES = ['formula', 'lookup', 'progress', 'auto_number', 'creation_log', 'last_updated', 'pulse_id', 'mirror', 'time_tracking'];

export const syncTaskToMonday = async (
  apiKey: string,
  boardId: string,
  taskName: string,
  durationSeconds: number,
  date: Date,
  employeeName: string,
  mappings: Array<{ columnId: string; source: string; staticValue?: string; type?: string }>,
  groupId?: string,
  startTime?: string,
  endTime?: string
): Promise<{ success: boolean; error?: string; id?: string }> => {
  try {
    const columnValues: Record<string, any> = {};
    
    // Helper for date formatting
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    mappings.forEach(mapping => {
      if (mapping.source === 'none') return;
      if (mapping.type && READ_ONLY_TYPES.includes(mapping.type)) {
        console.warn(`Skipping write to read-only column ${mapping.columnId} (type: ${mapping.type})`);
        return;
      }
      
      let value: any = '';
      if (mapping.source === 'duration') value = Math.round(durationSeconds / 60);
      else if (mapping.source === 'duration_h') value = (durationSeconds / 3600).toFixed(2);
      else if (mapping.source === 'date') value = formatDate(date);
      else if (mapping.source === 'employee') value = employeeName;
      else if (mapping.source === 'task_name') value = taskName;
      else if (mapping.source === 'start_time') value = startTime || '';
      else if (mapping.source === 'end_time') value = endTime || '';
      else if (mapping.source === 'static') value = mapping.staticValue || '';

      if (!value && mapping.source !== 'static' && mapping.source !== 'none') return;

      // Format based on column type
      if (mapping.type === 'country' && value) {
        const code = countryCodeMap[value] || 'US';
        columnValues[mapping.columnId] = { countryCode: code, countryName: value };
      } else if (mapping.type === 'tags' && value) {
        const tagNames = value.split(',').map((s: string) => s.trim()).filter(Boolean);
        columnValues[mapping.columnId] = { tag_names: tagNames };
      } else if (mapping.type === 'people' && value) {
        // If it's an email format
        if (value.includes('@')) {
           columnValues[mapping.columnId] = { emails: [value] };
        } else {
           columnValues[mapping.columnId] = value;
        }
      } else {
        columnValues[mapping.columnId] = value;
      }
    });

    const mutation = `
      mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!, $groupId: String) {
        create_item (board_id: $boardId, item_name: $itemName, column_values: $columnValues, group_id: $groupId) {
          id
        }
      }
    `;

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
        'API-Version': '2023-10'
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          boardId,
          itemName: taskName,
          columnValues: JSON.stringify(columnValues),
          groupId
        }
      })
    });

    const result = await response.json();
    if (result.errors) {
      let error = result.errors[0].message;
      if (error.toLowerCase().includes('auto calculated') || error.toLowerCase().includes('can not be updated')) {
        error = "Sync Failed: One or more mapped columns are 'Read-Only' or 'Auto-Calculated' (e.g., Formula or Progress columns). Please check your mappings.";
      }
      return { success: false, error };
    }
    return { success: true, id: result.data.create_item.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getSampleItems = async (apiKey: string, boardId: string, groupId?: string) => {
  const query = `
    query ($boardId: [ID!]!) {
      boards (ids: $boardId) {
        items_page (limit: 3) {
          items {
            id
            name
            column_values {
              id
              type
              text
              value
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
        'API-Version': '2023-10'
      },
      body: JSON.stringify({ query, variables: { boardId } })
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    const items = result.data.boards[0]?.items_page?.items || [];
    
    // If groupId is provided, filter them (since items_page filtering is complex in GraphQL)
    if (groupId) {
      // Note: In real app, we should use the API's filtering if possible, 
      // but for diagnostics, client-side filter of the first few items is often enough to find a match.
    }

    return items;
  } catch (error) {
    console.error('Failed to fetch sample items:', error);
    throw error;
  }
};

export const getBoardMetadata = async (apiKey: string, boardId: string): Promise<BoardResult> => {
  try {
    const query = `
      query ($boardId: ID!) {
        boards (ids: [$boardId]) {
          name
          groups {
            id
            title
          }
          columns {
            id
            title
            type
            settings_str
          }
        }
        tags {
          id
          name
        }
      }
    `;

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
        'API-Version': '2023-10'
      },
      body: JSON.stringify({
        query,
        variables: { boardId }
      })
    });

    const result = await response.json();
    if (result.errors) {
      return { success: false, error: result.errors[0].message };
    }

    const board = result.data.boards[0];
    if (!board) return { success: false, error: 'Board not found' };

    const tags = (result.data.tags || []).map((t: any) => t.name);

    return {
      success: true,
      metadata: {
        name: board.name,
        groups: board.groups,
        columns: board.columns.map((col: any) => {
          let options: string[] = [];
          
          if (col.type === 'tags') {
            options = tags;
          } else if (col.type === 'country') {
            options = Object.keys(countryCodeMap);
          } else if (col.settings_str && (col.type === 'status' || col.type === 'dropdown' || col.type === 'color_picker')) {
            try {
              const settings = JSON.parse(col.settings_str);
              if (settings.labels) {
                options = Object.values(settings.labels).filter((l): l is string => typeof l === 'string' && l !== '');
              } else if (settings.options) {
                options = (settings.options as any[]).map((opt: any) => opt.name || opt.label);
              }
            } catch (e) {
              console.error('Failed to parse column settings', e);
            }
          }

          return {
            id: col.id,
            title: col.title,
            type: col.type,
            options: options.length > 0 ? options : undefined
          };
        })
      }
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
