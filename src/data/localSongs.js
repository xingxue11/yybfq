/**
 * Pre-built song manifest from public/music/ folder.
 * Each entry has:
 *  - id: unique identifier
 *  - title: song title parsed from filename
 *  - artist: artist parsed from filename
 *  - src: path relative to public/ (accessible at runtime via PUBLIC_URL)
 *  - lrcPath: path to corresponding .lrc file
 *  - cover: path to album cover .jpg file (or empty if none)
 *  - type: 'prebuilt' to distinguish from user-uploaded files
 */

const RAW_SONGS = [
  'HOYO-MiX - Da Capo.mp3',
  'Top Barry _ INDEcompany - 一半一半.mp3',
  '七叔（叶泽浩） - 半生雪.mp3',
  '久石让 _ 井上杏美 - 君をのせて (伴随着你).mp3',
  '周深 - 等晴天.mp3',
  '周深 _ 王者荣耀世界 - 有你在的世界.mp3',
  '平生不晚 - 青玉恋 (戏腔版).mp3',
  '庄东茹 _ LvJam橙 - 真爱假说.mp3',
  '张韶涵 _ HOYO-MiX - 昔涟.mp3',
  '李荣浩 - 不遗憾.mp3',
  '梅梅 - 执意.mp3',
  '洛天依 _ 乐正绫 - 霜雪千年.mp3',
  '花澤香菜 - I wonder why….ogg',
  '花粥 _ 王胜娚 - 出山.mp3',
  '蒋雪儿Snow_J - 燕无歇.mp3',
  '蒋雪儿Snow_J - 莫问归期.mp3',
  '蒋雪儿Snow_J - 落了白.mp3',
  '蓝心羽 - 阿拉斯加海湾.mp3',
  '银临 - 泸沽寻梦.mp3',
  '银临 _ Aki阿杰 - 牵丝戏.mp3',
  '闻人听書_ - 一笑江湖.mp3',
  '闻人听書_ - 虞兮叹.mp3',
  '陈粒 - 小半.mp3',
  '陈粒 - 虚拟.mp3',
  '马頔 - 南山南.mp3',
  '黄诗扶 - 九万字.mp3',
  'CRITTY _ 司夏 - 杏花弦外雨.mp3',
  'Gareth_T - 玻璃.mp3',
  '格雷西西西 - 负心多是读书郎.mp3',
  '李毅恩Lye - 遥不可及.mp3',
  '灼夭 _ 祝青（G2er） - 风催雨.mp3',
  '足迹 - 江南忆故人.mp3',
];

/**
 * Cover image filename mapping.
 * Key: base filename (without extension) as it appears in RAW_SONGS
 * Value: actual .jpg filename in public/music/
 */
const COVER_MAP = {
  'Top Barry _ INDEcompany - 一半一半': 'Top BarryINDEcompany - 一半一半.jpg',
  '久石让 _ 井上杏美 - 君をのせて (伴随着你)': '久石让井上杏美 (井上あずみ) - 君をのせて (伴随着你).jpg',
  '周深 _ 王者荣耀世界 - 有你在的世界': '周深王者荣耀世界 - 有你在的世界.jpg',
  '庄东茹 _ LvJam橙 - 真爱假说': '庄东茹LvJam橙 - 真爱假说.jpg',
  '张韶涵 _ HOYO-MiX - 昔涟': '张韶涵HOYO-MiX - 昔涟.jpg',
  '洛天依 _ 乐正绫 - 霜雪千年': '洛天依乐正绫 - 霜雪千年.jpg',
  '花粥 _ 王胜娚 - 出山': '花粥王胜娚 - 出山.jpg',
  '银临 _ Aki阿杰 - 牵丝戏': '银临Aki阿杰 - 牵丝戏.jpg',
  '蒋雪儿Snow_J - 燕无歇': '蒋雪儿Snow.J - 燕无歇.jpg',
  '蒋雪儿Snow_J - 莫问归期': '蒋雪儿Snow.J - 莫问归期.jpg',
  '蒋雪儿Snow_J - 落了白': '蒋雪儿Snow.J - 落了白.jpg',
  'CRITTY _ 司夏 - 杏花弦外雨': 'CRITTY司夏 - 杏花弦外雨.jpg',
  'Gareth_T - 玻璃': 'Gareth.T - 玻璃.jpg',
  '灼夭 _ 祝青（G2er） - 风催雨': '灼夭祝青（G2er） - 风催雨.jpg',
};

function getCoverFilename(baseName) {
  if (COVER_MAP[baseName]) return COVER_MAP[baseName];
  return `${baseName}.jpg`;
}

function parseFilename(filename) {
  const parts = filename.split(' - ');
  if (parts.length >= 2) {
    const extMatch = parts[parts.length - 1].match(/\.(\w+)$/);
    const ext = extMatch ? extMatch[1] : 'ogg';
    const title = parts[parts.length - 1].replace(/\.\w+$/, '');
    const artist = parts.slice(0, -1).join(' - ');
    return { artist: artist.trim(), title: title.trim(), ext };
  }
  const extMatch = filename.match(/\.(\w+)$/);
  const ext = extMatch ? extMatch[1] : 'ogg';
  const title = filename.replace(/\.\w+$/, '');
  return { artist: '未知艺术家', title: title.trim(), ext };
}

export function buildPrebuiltSongs(publicUrl) {
  return RAW_SONGS.map((filename, index) => {
    const { artist, title, ext } = parseFilename(filename);
    const baseName = filename.replace(/\.\w+$/, '');
    const mimeType = ext === 'mp3' ? 'audio/mpeg' : 'audio/ogg';
    const coverFilename = getCoverFilename(baseName);
    const coverPath = coverFilename
      ? `${publicUrl}/music/${encodeURI(coverFilename)}`
      : '';

    return {
      id: `prebuilt-${index}`,
      title,
      artist,
      src: `${publicUrl}/music/${encodeURI(filename)}`,
      lrcPath: `${publicUrl}/music/${encodeURI(baseName)}.lrc`,
      cover: coverPath,
      type: 'prebuilt',
      mimeType,
      lyrics: '',
      lyricsLoaded: false,
    };
  });
}

export async function loadLyricsForSong(song) {
  if (song.lyricsLoaded || !song.lrcPath) return song;
  try {
    const resp = await fetch(song.lrcPath);
    if (resp.ok) {
      const buffer = await resp.arrayBuffer();
      const decoder = new TextDecoder('gbk');
      const text = decoder.decode(buffer);
      return { ...song, lyrics: text, lyricsLoaded: true };
    }
  } catch (e) {
    console.warn(`Failed to load lyrics for ${song.title}:`, e.message);
  }
  return {
    ...song,
    lyrics: `[00:00.00]${song.title} - ${song.artist}\n[00:05.00]暂无歌词`,
    lyricsLoaded: true,
  };
}

export default RAW_SONGS;
