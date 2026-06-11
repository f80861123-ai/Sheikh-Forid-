/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IPTVChannel {
  id: string;
  name: string;
  logo: string | null;
  url: string;
  category: string;
}

/**
 * Parses raw .m3u playlist string content into structured IPTVChannel objects
 */
export function parseM3U(m3uContent: string): IPTVChannel[] {
  const channels: IPTVChannel[] = [];
  const lines = m3uContent.split(/\r?\n/);
  
  let currentMeta: {
    name: string;
    logo: string | null;
    category: string;
  } | null = null;

  let streamCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    // Check if the line is metadata
    if (line.startsWith('#EXTINF:')) {
      streamCount++;
      
      // Extract tvg-logo
      let logo: string | null = null;
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i) || line.match(/logo="([^"]*)"/i);
      if (logoMatch && logoMatch[1]) {
        logo = logoMatch[1];
      }

      // Extract group-title (category)
      let category = 'General';
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      if (groupMatch && groupMatch[1]) {
        category = groupMatch[1];
      }

      // Extract channel name
      // Name is usually after the last comma: #EXTINF:-1 tvg-id="..." ,Channel Name
      let name = '';
      const commaIndex = line.lastIndexOf(',');
      if (commaIndex !== -1) {
        name = line.substring(commaIndex + 1).trim();
      }

      // Fallback name checks if name empty
      if (!name) {
        const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
        if (tvgNameMatch && tvgNameMatch[1]) {
          name = tvgNameMatch[1];
        } else {
          name = `Channel ${streamCount}`;
        }
      }

      currentMeta = {
        name,
        logo,
        category,
      };
    } 
    // It is a streaming URL
    else if (!line.startsWith('#')) {
      // Validate it looks like a URL
      if (line.includes('://')) {
        const id = `ch-${streamCount}-${Math.random().toString(36).substr(2, 9)}`;
        channels.push({
          id,
          name: currentMeta?.name || `Channel ${channels.length + 1}`,
          logo: currentMeta?.logo || null,
          url: line,
          category: currentMeta?.category || 'General',
        });
      }
      currentMeta = null; // Reset for next items
    }
  }

  return channels;
}

/**
 * Filter list of channels based on user queries
 */
export function filterChannels(channels: IPTVChannel[], query: string, category: string): IPTVChannel[] {
  const normalizedQuery = query.toLowerCase().trim();
  return channels.filter(channel => {
    const matchesQuery = !query || 
      channel.name.toLowerCase().includes(normalizedQuery) || 
      channel.category.toLowerCase().includes(normalizedQuery);
    
    const matchesCategory = !category || category === 'All' || channel.category === category;
    
    return matchesQuery && matchesCategory;
  });
}
