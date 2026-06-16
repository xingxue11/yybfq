/**
 * Song category definitions for the homepage chunked layout.
 * Each category has a key, display name, icon, accent color, and a filter fn.
 */

const CATEGORIES = [
  {
    key: 'classical',
    name: '古风国韵',
    icon: 'lantern',
    description: '诗酒趁年华，一曲古风诉衷肠',
    color: '#e74c3c',
    // Matched by artist name
    artists: [
      '河图', '银临', '双笙', '洛天依', '黄诗扶', '闻人听書',
      '蒋雪儿', '艾辰', '郑浩', '平生不晚', '七叔',
    ],
  },
  {
    key: 'pop',
    name: '流行热歌',
    icon: 'fire',
    description: '当下最热，打动你心的旋律',
    color: '#f39c12',
    artists: [
      '周深', '陈粒', '薛之谦', '李荣浩', '刘大壮',
      '蓝心羽', '梅梅', '殷一尧', '庄东茹', 'Top Barry',
      '花粥', '王胜娚', '马頔',
    ],
  },
  {
    key: 'acg',
    name: '游戏动漫',
    icon: 'gamepad',
    description: '来自异次元的奇妙声音之旅',
    color: '#9b59b6',
    artists: [
      'HOYO-MiX', '花澤香菜', 'TheFatRat', '张韶涵',
      '茶理理理子', '妄想山海', '久石让',
    ],
  },
];

/**
 * Check if a song belongs to a category by matching its artist.
 */
function songMatchesCategory(song, category) {
  if (!song || !song.artist) return false;
  return category.artists.some(a => song.artist.includes(a));
}

/**
 * Group prebuilt songs into their categories.
 * Returns an array of { category, songs } objects.
 * Songs that don't match any category go into "更多推荐".
 */
export function getCategorizedSongs(prebuiltSongs) {
  const result = CATEGORIES.map(cat => ({
    category: cat,
    songs: prebuiltSongs.filter(s => songMatchesCategory(s, cat)),
  }));

  // Collect all matched song ids
  const matchedIds = new Set(
    result.flatMap(g => g.songs.map(s => s.id))
  );

  // Put unmatched into a catch-all
  const unmatched = prebuiltSongs.filter(s => !matchedIds.has(s.id));
  if (unmatched.length > 0) {
    result.push({
      category: {
        key: 'more',
        name: '更多推荐',
        icon: 'music',
        description: '发现更多好音乐',
        color: '#3498db',
      },
      songs: unmatched,
    });
  }

  // Only return groups that have songs
  return result.filter(g => g.songs.length > 0);
}

export default CATEGORIES;
